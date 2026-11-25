// Pruebas unitarias (no necesitan base de datos): npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateReview, validateRegister } = require('../src/utils/validators');
const rateLimit = require('../src/utils/rateLimit');

const valid = {
  nombreRestaurante: '  El Fogón  ',
  calificacion: 4,
  fechaVisita: '2026-11-01',
  observaciones: ' Muy bueno ',
};

test('reseña válida: limpia espacios y devuelve solo los campos permitidos', () => {
  const { errors, data } = validateReview({ ...valid, user: 'intento-de-suplantar', _id: 'x' });
  assert.deepEqual(errors, []);
  assert.equal(data.nombreRestaurante, 'El Fogón');
  assert.equal(data.observaciones, 'Muy bueno');
  assert.equal(data.calificacion, 4);
  assert.equal('user' in data, false);
  assert.equal('_id' in data, false);
});

test('reseña: calificación fuera de rango o no entera es rechazada', () => {
  for (const c of [0, 6, -1, 3.5, 'abc', '', null, undefined]) {
    const { errors } = validateReview({ ...valid, calificacion: c });
    assert.ok(errors.length > 0, `debería rechazar calificacion=${String(c)}`);
  }
});

test('reseña: acepta calificación numérica enviada como texto ("5")', () => {
  const { errors, data } = validateReview({ ...valid, calificacion: '5' });
  assert.deepEqual(errors, []);
  assert.equal(data.calificacion, 5);
});

test('reseña: nombre vacío, no texto o demasiado largo es rechazado', () => {
  for (const n of ['', '   ', 123, null, { $ne: 1 }, 'x'.repeat(121)]) {
    const { errors } = validateReview({ ...valid, nombreRestaurante: n });
    assert.ok(errors.length > 0);
  }
});

test('reseña: fecha inválida o futura es rechazada', () => {
  assert.ok(validateReview({ ...valid, fechaVisita: 'no-es-fecha' }).errors.length > 0);
  assert.ok(validateReview({ ...valid, fechaVisita: undefined }).errors.length > 0);
  assert.ok(validateReview({ ...valid, fechaVisita: '2999-01-01' }).errors.length > 0);
});

test('reseña: observaciones opcionales, pero con límite de 1000 y solo texto', () => {
  const sin = validateReview({ ...valid, observaciones: undefined });
  assert.deepEqual(sin.errors, []);
  assert.equal(sin.data.observaciones, '');
  assert.ok(validateReview({ ...valid, observaciones: 'x'.repeat(1001) }).errors.length > 0);
  assert.ok(validateReview({ ...valid, observaciones: { a: 1 } }).errors.length > 0);
});

test('reseña: body ausente no rompe la validación', () => {
  assert.ok(validateReview(undefined).errors.length > 0);
  assert.ok(validateReview(null).errors.length > 0);
});

test('registro válido normaliza el email', () => {
  const { errors, data } = validateRegister({ nombre: ' Ana ', email: ' ANA@Correo.COM ', password: 'secreta1' });
  assert.deepEqual(errors, []);
  assert.equal(data.nombre, 'Ana');
  assert.equal(data.email, 'ana@correo.com');
});

test('registro: rechaza email inválido, contraseña corta/larga y tipos raros', () => {
  assert.ok(validateRegister({ nombre: 'A', email: 'sin-arroba', password: 'secreta1' }).errors.length > 0);
  assert.ok(validateRegister({ nombre: 'A', email: 'a@b.co', password: '123' }).errors.length > 0);
  assert.ok(validateRegister({ nombre: 'A', email: 'a@b.co', password: 'x'.repeat(73) }).errors.length > 0);
  assert.ok(validateRegister({ nombre: 'A', email: { $ne: '' }, password: 'secreta1' }).errors.length > 0);
  assert.ok(validateRegister({ nombre: '', email: 'a@b.co', password: 'secreta1' }).errors.length > 0);
});

test('rateLimit: bloquea con 429 al superar el máximo y no antes', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 3 });
  const req = { ip: '1.2.3.4' };
  let status = null;
  const res = {
    set() {},
    status(s) { status = s; return this; },
    json() { return this; },
  };
  let passed = 0;
  for (let i = 0; i < 5; i++) limiter(req, res, () => passed++);
  assert.equal(passed, 3);
  assert.equal(status, 429);
});

test('rateLimit: cada IP tiene su propio contador', () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });
  const res = { set() {}, status() { return this; }, json() { return this; } };
  let passed = 0;
  limiter({ ip: 'a' }, res, () => passed++);
  limiter({ ip: 'b' }, res, () => passed++);
  assert.equal(passed, 2);
});
