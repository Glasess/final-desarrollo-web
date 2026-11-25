require('dotenv').config();
const mongoose = require('mongoose');
const createApp = require('./app');

const { PORT = 3000, MONGO_URI, JWT_SECRET, CORS_ORIGIN = 'http://localhost:5173' } = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('Faltan variables de entorno: MONGO_URI y JWT_SECRET (ver .env.example)');
  process.exit(1);
}
if (JWT_SECRET.length < 16) {
  console.error('JWT_SECRET es demasiado corto: usa al menos 16 caracteres aleatorios');
  process.exit(1);
}

const app = createApp({ corsOrigin: CORS_ORIGIN });

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
