const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'productos_db',
  user: process.env.DB_USER || 'productos_user',
  password: process.env.DB_PASSWORD || 'productos_local',
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('Error inesperado en el pool de PostgreSQL:', error);
});

module.exports = pool;
