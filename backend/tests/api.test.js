// Pruebas de integración de la API con una MongoDB en memoria: npm run test:api
// (la primera vez mongodb-memory-server descarga el binario de MongoDB; requiere internet)
const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'clave-de-pruebas-larga-y-aleatoria-123';

const createApp = require('../src/app');

let mongod;
let server;
let base;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  server?.close();
  await mongoose.disconnect();
  await mongod?.stop();
});

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const review = (extra = {}) => ({
  nombreRestaurante: 'La Trattoria',
  calificacion: 5,
  fechaVisita: '2026-10-10',
  observaciones: 'Excelente pasta',
  ...extra,
});

test('flujo completo con aislamiento entre usuarios', async (t) => {
  let t1, t2, reviewId;

  await t.test('registro de dos usuarios y rechazo de email repetido', async () => {
    const a = await call('/auth/register', { method: 'POST', body: { nombre: 'Ana', email: 'ana@test.com', password: 'secreta1' } });
    assert.equal(a.status, 201);
    t1 = a.body.token;
    const b = await call('/auth/register', { method: 'POST', body: { nombre: 'Beto', email: 'beto@test.com', password: 'secreta2' } });
    assert.equal(b.status, 201);
    t2 = b.body.token;
    const dup = await call('/auth/register', { method: 'POST', body: { nombre: 'Ana 2', email: 'ANA@test.com', password: 'secreta1' } });
    assert.equal(dup.status, 409);
  });

  await t.test('login correcto e incorrecto', async () => {
    const ok = await call('/auth/login', { method: 'POST', body: { email: 'ana@test.com', password: 'secreta1' } });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
    assert.equal(ok.body.user.password, undefined);
    const mal = await call('/auth/login', { method: 'POST', body: { email: 'ana@test.com', password: 'otra-clave' } });
    assert.equal(mal.status, 401);
  });

  await t.test('sin token o con token falso → 401', async () => {
    assert.equal((await call('/reviews')).status, 401);
    assert.equal((await call('/reviews', { token: 'abc.def.ghi' })).status, 401);
  });

  await t.test('Ana crea una reseña y la ve en su lista', async () => {
    const c = await call('/reviews', { method: 'POST', token: t1, body: review() });
    assert.equal(c.status, 201);
    reviewId = c.body._id;
    const list = await call('/reviews', { token: t1 });
    assert.equal(list.body.length, 1);
  });

  await t.test('el cliente no puede suplantar al dueño enviando "user"', async () => {
    const c = await call('/reviews', { method: 'POST', token: t2, body: review({ user: new mongoose.Types.ObjectId().toString() }) });
    assert.equal(c.status, 201);
    const mine = await call('/reviews', { token: t2 });
    assert.equal(mine.body.length, 1); // quedó a nombre de Beto, no del id inventado
  });

  await t.test('Beto NO ve, edita ni elimina la reseña de Ana', async () => {
    const list = await call('/reviews', { token: t2 });
    assert.ok(list.body.every((r) => r._id !== reviewId));
    assert.equal((await call(`/reviews/${reviewId}`, { token: t2 })).status, 404);
    assert.equal((await call(`/reviews/${reviewId}`, { method: 'PUT', token: t2, body: review({ nombreRestaurante: 'Hackeado' }) })).status, 404);
    assert.equal((await call(`/reviews/${reviewId}`, { method: 'DELETE', token: t2 })).status, 404);
    const still = await call(`/reviews/${reviewId}`, { token: t1 });
    assert.equal(still.status, 200);
    assert.equal(still.body.nombreRestaurante, 'La Trattoria');
  });

  await t.test('validaciones: calificación y fecha inválidas → 400', async () => {
    assert.equal((await call('/reviews', { method: 'POST', token: t1, body: review({ calificacion: 9 }) })).status, 400);
    assert.equal((await call('/reviews', { method: 'POST', token: t1, body: review({ fechaVisita: 'nada' }) })).status, 400);
  });

  await t.test('id mal formado → 404', async () => {
    assert.equal((await call('/reviews/123', { token: t1 })).status, 404);
  });

  await t.test('Ana edita y elimina su propia reseña', async () => {
    const up = await call(`/reviews/${reviewId}`, { method: 'PUT', token: t1, body: review({ calificacion: 3 }) });
    assert.equal(up.status, 200);
    assert.equal(up.body.calificacion, 3);
    assert.equal((await call(`/reviews/${reviewId}`, { method: 'DELETE', token: t1 })).status, 204);
    assert.equal((await call(`/reviews/${reviewId}`, { token: t1 })).status, 404);
  });
});
