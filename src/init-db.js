require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('./db');

async function inicializarBase() {
  try {
    const sql = await fs.readFile(path.join(__dirname, '..', 'db', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Esquema y datos iniciales de productos listos.');
  } catch (error) {
    console.error('No se pudo inicializar la base de datos:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch (error) {
      console.error('No se pudo cerrar el pool de PostgreSQL:', error.message);
      process.exitCode = 1;
    }
  }
}

inicializarBase().catch((error) => {
  console.error('Error inesperado al inicializar la base de datos:', error.message);
  process.exitCode = 1;
});
