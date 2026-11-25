const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Verifica el JWT y deja el id del usuario autenticado en req.userId.
// El id del dueño de los datos sale SIEMPRE de aquí, nunca del body ni de la URL.
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!mongoose.isValidObjectId(payload.sub)) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
