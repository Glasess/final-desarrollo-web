# 🍽️ Reseñas de Restaurantes

Aplicación web con **login por token (JWT)** y **CRUD de reseñas por usuario**: cada persona registra, consulta, edita y elimina únicamente sus propias reseñas de restaurantes.

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Base de datos | MongoDB (Mongoose) |
| Autenticación | JWT (2 h) + contraseñas con bcrypt; el token se guarda en `sessionStorage` |

```
Frontend ──Iniciar sesión──▶ Backend ──▶ MongoDB
Frontend ◀──────Token────── Backend
Frontend ◀──CRUD Reseñas──▶ Backend
```

Cada reseña tiene: `nombreRestaurante`, `calificacion` (1 a 5), `fechaVisita` y `observaciones`.

## Integrantes
- _Nombre 1_
- _Nombre 2_
- _Nombre 3_

## Funcionalidades
- Registro e inicio de sesión; el token viaja en `Authorization: Bearer <token>`.
- Crear, listar, editar y eliminar reseñas propias (con confirmación antes de eliminar).
- Calificación con estrellas clicables, búsqueda por restaurante y orden (recientes, mejor calificadas, A-Z).
- Si el token vence o es inválido, la sesión se cierra automáticamente.
- Diseño responsive (móvil y escritorio).

## Cómo ejecutar

Requisitos: **Node 18+** y **MongoDB** local (o una URI de MongoDB Atlas).

### 1. Backend
```bash
cd backend
cp .env.example .env     # en Windows: copy .env.example .env
# edita .env: pon un JWT_SECRET largo y aleatorio (mínimo 16 caracteres) y tu MONGO_URI
npm install
npm run dev              # http://localhost:3000   (comprobar: /api/health)
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env     # opcional: solo si el backend no está en localhost:3000
npm install
npm run dev              # http://localhost:5173
```

> El `CORS_ORIGIN` del backend debe coincidir con la URL del frontend (por defecto `http://localhost:5173`).

## Variables de entorno

**backend/.env**

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto de la API (3000) |
| `MONGO_URI` | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Clave para firmar tokens (mínimo 16 caracteres; **no se sube a Git**) |
| `CORS_ORIGIN` | Origen(es) permitido(s) del frontend, separados por coma |

**frontend/.env**: `VITE_API_URL` (por defecto `http://localhost:3000/api`).

## API

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/health` | Público | Estado del servidor |
| POST | `/api/auth/register` | Público | Crea usuario y devuelve `{ token, user }` |
| POST | `/api/auth/login` | Público | Devuelve `{ token, user }` |
| GET | `/api/reviews` | Token | Lista **solo** las reseñas del usuario logueado |
| GET | `/api/reviews/:id` | Token | Obtiene una reseña propia |
| POST | `/api/reviews` | Token | Crea una reseña (el dueño es el usuario del token) |
| PUT | `/api/reviews/:id` | Token | Edita una reseña propia |
| DELETE | `/api/reviews/:id` | Token | Elimina una reseña propia |

Códigos: `400` datos inválidos · `401` sin token o token inválido · `404` reseña inexistente **o de otro usuario** · `409` email repetido · `429` demasiados intentos de login.

## Seguridad y aislamiento de datos
- El dueño de la reseña se toma **siempre del JWT** (`req.userId`), nunca del body ni de la URL.
- Todas las consultas filtran por `{ _id, user: req.userId }`; si la reseña es de otro usuario la API responde `404` (no revela que existe).
- Crear y editar solo aceptan los 4 campos permitidos: aunque el cliente envíe `user`, se ignora.
- Validación en el servidor de tipos, rangos (calificación entera 1-5), longitudes y fecha (no futura).
- Contraseñas con bcrypt; el JWT se firma y verifica con `HS256` y vence en 2 horas.
- Límite de 20 intentos por IP cada 15 minutos en login y registro.
- Mensajes de error genéricos: la API no filtra detalles internos.
- `.env` está en `.gitignore`; en el repo solo hay `.env.example`.

## Pruebas

```bash
cd backend
npm install
npm test          # pruebas unitarias (validaciones y límite de intentos), sin base de datos
npm run test:api  # pruebas de integración con MongoDB en memoria
```

`npm run test:api` cubre registro, login, email repetido, rutas sin token y el aislamiento entre usuarios (un usuario no puede ver, editar ni eliminar reseñas de otro). La primera vez descarga un binario de MongoDB, por lo que necesita internet.

## Estructura
```
resenas-restaurantes/
├── backend/
│   ├── src/
│   │   ├── app.js              # configura Express (rutas, CORS, errores)
│   │   ├── server.js           # conecta a MongoDB y levanta el servidor
│   │   ├── middleware/         # auth (JWT) y manejo de errores
│   │   ├── models/             # User y Review (Mongoose)
│   │   ├── routes/             # auth y reviews
│   │   └── utils/              # validaciones y límite de intentos
│   └── tests/
└── frontend/
    └── src/
        ├── api.js              # cliente HTTP y manejo de sessionStorage
        ├── App.jsx
        └── components/         # Login, Reviews, ReviewForm, ReviewCard, StarRating, ConfirmDialog
```
