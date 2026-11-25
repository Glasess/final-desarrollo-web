const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const { validateReview } = require('../utils/validators');

const router = express.Router();

// Todas las rutas requieren sesión
router.use(auth);

// Un id mal formado se trata igual que uno inexistente (404)
function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: 'Reseña no encontrada' });
  }
  next();
}

// Valida el body y deja los datos limpios en req.reviewData.
// Solo pasan los 4 campos permitidos: el cliente no puede enviar "user".
function validateBody(req, res, next) {
  const { errors, data } = validateReview(req.body);
  if (errors.length) return res.status(400).json({ message: errors[0], errors });
  req.reviewData = data;
  next();
}

// GET /api/reviews  -> solo las reseñas del usuario autenticado
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.userId }).sort({ fechaVisita: -1, createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// GET /api/reviews/:id
router.get('/:id', validId, async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.userId });
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json(review);
  } catch (err) {
    next(err);
  }
});

// POST /api/reviews
router.post('/', validateBody, async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.reviewData, user: req.userId });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

// PUT /api/reviews/:id  (solo si la reseña es del usuario)
router.put('/:id', validId, validateBody, async (req, res, next) => {
  try {
    const review = await Review.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.reviewData,
      { new: true, runValidators: true }
    );
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json(review);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reviews/:id  (solo si la reseña es del usuario)
router.delete('/:id', validId, async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
