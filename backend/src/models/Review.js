const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // Dueño de la reseña: se asigna SIEMPRE desde el token, nunca desde el body
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nombreRestaurante: { type: String, required: true, trim: true, maxlength: 120 },
    calificacion: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'La calificación debe ser un entero' },
    },
    fechaVisita: { type: Date, required: true },
    observaciones: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
);

// Todas las consultas filtran por usuario y ordenan por fecha de visita
reviewSchema.index({ user: 1, fechaVisita: -1 });

module.exports = mongoose.model('Review', reviewSchema);
