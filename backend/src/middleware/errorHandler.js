// 404 para rutas inexistentes
function notFound(_req, res) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}

// Manejador central de errores: nunca filtra detalles internos al cliente
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON inválido en la solicitud' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'La solicitud es demasiado grande' });
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: 'Datos inválidos' });
  }
  // Índice único (email repetido, p. ej. por una carrera entre dos registros)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
