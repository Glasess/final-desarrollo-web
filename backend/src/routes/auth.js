const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('../utils/rateLimit');
const { validateRegister } = require('../utils/validators');

const router = express.Router();

// Máximo 20 intentos por IP cada 15 minutos (frena fuerza bruta)
router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// Hash de relleno para que login tarde parecido exista o no el correo
const DUMMY_HASH = bcrypt.hashSync('relleno-para-igualar-tiempos', 10);

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '2h',
  });
}

const publicUser = (u) => ({ id: u._id, nombre: u.nombre, email: u.email });

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { errors, data } = validateRegister(req.body);
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    if (await User.exists({ email: data.email })) {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await User.create({ nombre: data.nombre, email: data.email, password: hash });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  ->  { token, user }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ message: 'email y password son obligatorios' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
