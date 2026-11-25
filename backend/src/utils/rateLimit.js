// Limitador de intentos en memoria (sin dependencias).
// Suficiente para un proyecto académico; en producción usar Redis o express-rate-limit.

module.exports = function rateLimit({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Limpieza periódica para que el Map no crezca sin control
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.resetAt <= now) hits.delete(ip);
  }, windowMs);
  timer.unref();

  return function limiter(req, res, next) {
    const now = Date.now();
    const ip = req.ip || 'unknown';
    let h = hits.get(ip);
    if (!h || h.resetAt <= now) {
      h = { count: 0, resetAt: now + windowMs };
      hits.set(ip, h);
    }
    h.count += 1;
    if (h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.resetAt - now) / 1000)));
      return res.status(429).json({ message: 'Demasiados intentos. Intenta de nuevo más tarde.' });
    }
    next();
  };
};
