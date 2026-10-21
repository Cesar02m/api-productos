require('dotenv').config();

const express = require('express');
const pool = require('./db');
const productosRouter = require('./routes/productos');

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/', (_req, res) => {
  res.json({ mensaje: 'La API de productos funciona.' });
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ estado: 'ok', api: 'ok', postgres: 'conectado' });
  } catch (_error) {
    res.status(503).json({ estado: 'error', api: 'ok', postgres: 'desconectado' });
  }
});

app.use('/api/productos', productosRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.', ruta: req.path });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud contiene JSON inválido.' });
  }
  console.error('Error en la API:', error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
});

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    app.listen(port, '0.0.0.0', () => {
      console.log(`API escuchando en http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a PostgreSQL:', error.message);
    process.exit(1);
  }
}

iniciar();
