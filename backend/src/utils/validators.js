// Validación de datos de reseñas (se usa en crear y editar).
// Devuelve { errors: string[], data: objeto limpio }.

const MAX_NOMBRE = 120;
const MAX_OBSERVACIONES = 1000;

function parseDate(value) {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validateReview(body) {
  const errors = [];
  const src = body && typeof body === 'object' ? body : {};
  const data = {};

  // nombreRestaurante
  if (typeof src.nombreRestaurante !== 'string' || !src.nombreRestaurante.trim()) {
    errors.push('El nombre del restaurante es obligatorio');
  } else if (src.nombreRestaurante.trim().length > MAX_NOMBRE) {
    errors.push(`El nombre del restaurante no puede superar ${MAX_NOMBRE} caracteres`);
  } else {
    data.nombreRestaurante = src.nombreRestaurante.trim();
  }

  // calificacion: entero entre 1 y 5
  const cal = Number(src.calificacion);
  if (src.calificacion === undefined || src.calificacion === '' || !Number.isInteger(cal) || cal < 1 || cal > 5) {
    errors.push('La calificación debe ser un número entero entre 1 y 5');
  } else {
    data.calificacion = cal;
  }

  // fechaVisita: fecha válida y no futura
  const fecha = parseDate(src.fechaVisita);
  if (!fecha) {
    errors.push('La fecha de visita es obligatoria y debe ser válida');
  } else {
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    // Se tolera un día de diferencia por husos horarios
    if (fecha.getTime() > endOfToday.getTime() + 24 * 60 * 60 * 1000) {
      errors.push('La fecha de visita no puede ser futura');
    } else {
      data.fechaVisita = fecha;
    }
  }

  // observaciones (opcional)
  if (src.observaciones !== undefined && src.observaciones !== null) {
    if (typeof src.observaciones !== 'string') {
      errors.push('Las observaciones deben ser texto');
    } else if (src.observaciones.length > MAX_OBSERVACIONES) {
      errors.push(`Las observaciones no pueden superar ${MAX_OBSERVACIONES} caracteres`);
    } else {
      data.observaciones = src.observaciones.trim();
    }
  } else {
    data.observaciones = '';
  }

  return { errors, data };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const errors = [];
  const src = body && typeof body === 'object' ? body : {};
  const data = {};

  if (typeof src.nombre !== 'string' || !src.nombre.trim()) {
    errors.push('El nombre es obligatorio');
  } else if (src.nombre.trim().length > 80) {
    errors.push('El nombre no puede superar 80 caracteres');
  } else {
    data.nombre = src.nombre.trim();
  }

  if (typeof src.email !== 'string' || !EMAIL_RE.test(src.email.trim())) {
    errors.push('Email inválido');
  } else {
    data.email = src.email.trim().toLowerCase();
  }

  if (typeof src.password !== 'string' || src.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  } else if (src.password.length > 72) {
    // bcrypt solo usa los primeros 72 bytes
    errors.push('La contraseña no puede superar 72 caracteres');
  } else {
    data.password = src.password;
  }

  return { errors, data };
}

module.exports = { validateReview, validateRegister, EMAIL_RE };
