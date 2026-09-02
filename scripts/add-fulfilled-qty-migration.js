const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  let connectionString = '';

  for (const line of envContent.split('\n')) {
    if (line.trim().startsWith('DATABASE_URL=')) {
      connectionString = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');

    console.log('Adding column fulfilled_quantity to demand_items if not exists...');
    await client.query(`
      ALTER TABLE public.demand_items 
      ADD COLUMN IF NOT EXISTS fulfilled_quantity INTEGER NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0);
    `);
    console.log('Column fulfilled_quantity added/verified.');

    console.log('Backfilling fulfilled_quantity for already in-stock or delivered items...');
    const updateRes = await client.query(`
      UPDATE public.demand_items 
      SET fulfilled_quantity = quantity 
      WHERE (is_in_stock = true OR is_delivered = true) AND (fulfilled_quantity IS NULL OR fulfilled_quantity = 0);
    `);
    console.log(`Backfilled ${updateRes.rowCount} rows.`);

    const checkRes = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'demand_items' AND column_name = 'fulfilled_quantity';
    `);
    console.log('Verification:', checkRes.rows);

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
