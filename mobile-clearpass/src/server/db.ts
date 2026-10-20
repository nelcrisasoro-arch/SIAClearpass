import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL Connection Pool configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sia_clearpass',
  port: Number(process.env.DB_PORT) || 3306,
  ...(process.env.DB_SSL?.toLowerCase() === 'true'
    ? { ssl: { rejectUnauthorized: true as const } }
    : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;
let isConnected = false;

export const getDbPool = () => {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
    } catch (err) {
      console.warn('⚠️ [MySQL] Could not initialize pool:', err);
    }
  }
  return pool;
};

export const testDbConnection = async (): Promise<boolean> => {
  try {
    const p = getDbPool();
    if (!p) return false;
    const [rows] = await p.query('SELECT 1 as connected');
    isConnected = true;
    console.log('✅ [MySQL] Successfully connected to database:', dbConfig.database);
    return true;
  } catch (err: any) {
    isConnected = false;
    console.warn('⚠️ [MySQL] Database offline or not configured yet:', err?.message || err);
    return false;
  }
};

export const isDbConnected = () => isConnected;
