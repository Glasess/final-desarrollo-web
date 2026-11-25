const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Crea la app Express (sin conectar a la base ni escuchar puertos: así se puede probar)
function createApp({ corsOrigin = 'http://localhost:5173' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correcto detrás de un proxy (Render, Railway, etc.)

  app.use(cors({ origin: corsOrigin.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes);
  app.use('/api/reviews', reviewRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
