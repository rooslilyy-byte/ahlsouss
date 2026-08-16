const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runSeed() {
  console.log('--- Starting Database Seeding & Verification ---');

  // 1. Read .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local file not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  let connectionString = '';

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=') || trimmed.startsWith('DIRECT_URL=')) {
      const parts = trimmed.split('=');
      const val = parts.slice(1).join('=').replace(/^["']|["']$/g, '');
      if (val && !val.includes('[YOUR-PASSWORD]')) {
        connectionString = val;
        break;
      }
    }
  }

  if (!connectionString) {
    console.error('Error: Could not find valid DATABASE_URL or DIRECT_URL in .env.local');
    process.exit(1);
  }

  // 2. Read seed.sql
  const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  // 3. Connect via pg
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database for seeding.');

    console.log('Executing supabase/seed.sql script...');
    await client.query(sql);
    console.log('Seed SQL executed successfully!');

    // 4. Verify counts
    const clientCnt = await client.query('SELECT COUNT(*) FROM public.clients;');
    const productCnt = await client.query('SELECT COUNT(*) FROM public.master_products;');
    const batchCnt = await client.query('SELECT COUNT(*) FROM public.purchase_batches;');
    const demandCnt = await client.query('SELECT COUNT(*) FROM public.client_demands;');
    const itemCnt = await client.query('SELECT COUNT(*) FROM public.demand_items;');

    console.log('\n================ DATABASE VERIFICATION SUMMARY ================');
    console.log(`• Clients (الزبناء): ${clientCnt.rows[0].count} records`);
    console.log(`• Master Products (كتالوج الكتب والسلع): ${productCnt.rows[0].count} items`);
    console.log(`• Purchase Batches (دفعات الطلبيات): ${batchCnt.rows[0].count} batches`);
    console.log(`• Client Demands (طلبيات الخصاص): ${demandCnt.rows[0].count} demands`);
    console.log(`• Demand Items (عناصر الطلبيات): ${itemCnt.rows[0].count} items`);
    console.log('===============================================================\n');

    console.log('SUCCESS: Database successfully populated with realistic Moroccan bookstore test data!');

  } catch (err) {
    console.error('Seeding failure:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
