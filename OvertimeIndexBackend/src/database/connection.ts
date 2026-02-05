import { Pool } from 'pg';

let pool: Pool | null = null;

export async function connectDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'overtime_index',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // 测试连接
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return pool;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('数据库未连接');
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  return pool.query(text, params);
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
