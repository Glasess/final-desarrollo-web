const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// El token de sesión vive en sessionStorage (se borra al cerrar la pestaña)
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const session = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      return JSON.parse(sessionStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  save: (token, user) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && session.getToken()) {
    headers.Authorization = `Bearer ${session.getToken()}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

  // Token vencido o inválido en una ruta protegida → cerrar sesión
  if (res.status === 401 && auth) {
    onUnauthorized();
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error en la solicitud');
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (nombre, email, password) =>
    request('/auth/register', { method: 'POST', body: { nombre, email, password }, auth: false }),
  listReviews: () => request('/reviews'),
  createReview: (data) => request('/reviews', { method: 'POST', body: data }),
  updateReview: (id, data) => request(`/reviews/${id}`, { method: 'PUT', body: data }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
};
