const express = require('express');
const pool = require('../db');

const router = express.Router();

function validarProducto(body, parcial = false) {
  const errores = [];
  const campos = ['nombre', 'descripcion', 'precio', 'stock'];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['El cuerpo de la solicitud debe ser un objeto JSON.'];
  }

  if (parcial && !campos.some((campo) => Object.hasOwn(body, campo))) {
    errores.push('Incluye al menos un campo para actualizar.');
  }

  if (!parcial || Object.hasOwn(body, 'nombre')) {
    if (typeof body.nombre !== 'string' || body.nombre.trim().length === 0 || body.nombre.trim().length > 150) {
      errores.push('nombre es obligatorio y debe tener entre 1 y 150 caracteres.');
    }
  }

  if (!parcial || Object.hasOwn(body, 'descripcion')) {
    if (typeof body.descripcion !== 'string' || body.descripcion.trim().length === 0) {
      errores.push('descripcion es obligatoria y debe ser texto no vacío.');
    }
  }

  if (!parcial || Object.hasOwn(body, 'precio')) {
    if (typeof body.precio !== 'number' || !Number.isFinite(body.precio) || body.precio < 0) {
      errores.push('precio debe ser un número mayor o igual a cero.');
    }
  }

  if (!parcial || Object.hasOwn(body, 'stock')) {
    if (!Number.isInteger(body.stock) || body.stock < 0) {
      errores.push('stock debe ser un entero mayor o igual a cero.');
    }
  }

  return errores;
}

function idValido(id) {
  return /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

router.get('/', async (_req, res, next) => {
  try {
    const resultado = await pool.query('SELECT id, nombre, descripcion, precio, stock FROM productos ORDER BY id');
    res.json(resultado.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  }

  try {
    const resultado = await pool.query(
      'SELECT id, nombre, descripcion, precio, stock FROM productos WHERE id = $1',
      [Number(req.params.id)],
    );
    if (resultado.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.json(resultado.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  const errores = validarProducto(req.body);
  if (errores.length) return res.status(400).json({ error: 'Datos inválidos.', detalles: errores });

  try {
    const { nombre, descripcion, precio, stock } = req.body;
    const resultado = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES ($1, $2, $3, $4) RETURNING id, nombre, descripcion, precio, stock',
      [nombre.trim(), descripcion.trim(), precio, stock],
    );
    return res.status(201).json(resultado.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });
  const errores = validarProducto(req.body, true);
  if (errores.length) return res.status(400).json({ error: 'Datos inválidos.', detalles: errores });

  try {
    const existente = await pool.query('SELECT id, nombre, descripcion, precio, stock FROM productos WHERE id = $1', [Number(req.params.id)]);
    if (existente.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });

    const actual = existente.rows[0];
    const actualizado = {
      nombre: Object.hasOwn(req.body, 'nombre') ? req.body.nombre.trim() : actual.nombre,
      descripcion: Object.hasOwn(req.body, 'descripcion') ? req.body.descripcion.trim() : actual.descripcion,
      precio: Object.hasOwn(req.body, 'precio') ? req.body.precio : Number(actual.precio),
      stock: Object.hasOwn(req.body, 'stock') ? req.body.stock : actual.stock,
    };
    const resultado = await pool.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4 WHERE id = $5 RETURNING id, nombre, descripcion, precio, stock',
      [actualizado.nombre, actualizado.descripcion, actualizado.precio, actualizado.stock, Number(req.params.id)],
    );
    return res.json(resultado.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'El id debe ser un entero positivo.' });

  try {
    const resultado = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING id, nombre, descripcion, precio, stock', [Number(req.params.id)]);
    if (resultado.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    return res.json({ mensaje: 'Producto eliminado correctamente.', producto: resultado.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
