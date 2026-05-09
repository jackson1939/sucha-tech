import { Pool } from 'pg';

declare global { var __pgPool: Pool | undefined; }

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) { console.warn('[db] DATABASE_URL no definida — sin base de datos'); return new Pool({ max: 0 }); }
  return new Pool({
    connectionString: url,
    ssl: url.includes('neon.tech') || url.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

const pool: Pool =
  process.env.NODE_ENV === 'development'
    ? (global.__pgPool ??= createPool())
    : createPool();

pool.on('error', (err) => console.error('[db] Pool error:', err.message));

export async function query<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try { return (await client.query(sql, params)).rows as T[]; }
  finally { client.release(); }
}

export async function queryOne<T extends object = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
  return (await query<T>(sql, params))[0] ?? null;
}

export default pool;
