import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or DIRECT_URL environment variable is missing.');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const result = await p.query(text, params);
  return result.rows as T[];
}
