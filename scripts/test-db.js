const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function testConnection() {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  let connectionString = '';

  for (const line of envContent.split('\n')) {
    if (line.trim().startsWith('DATABASE_URL=')) {
      connectionString = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }

  console.log('Testing connection to:', connectionString.replace(/:[^:@]+@/, ':****@'));

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log(' Connected to PostgreSQL successfully!');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Public Tables:', res.rows.map(r => r.table_name));

    for (const row of res.rows) {
      const cnt = await client.query(`SELECT COUNT(*) FROM public."${row.table_name}";`);
      console.log(`- ${row.table_name}: ${cnt.rows[0].count} rows`);
    }

  } catch (err) {
    console.error('Connection Error:', err);
  } finally {
    await client.end();
  }
}

testConnection();
