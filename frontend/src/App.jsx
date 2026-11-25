import { useEffect, useState } from 'react';
import { session, setUnauthorizedHandler } from './api.js';
import Login from './components/Login.jsx';
import Reviews from './components/Reviews.jsx';

export default function App() {
  const [user, setUser] = useState(session.getToken() ? session.getUser() : null);

  const logout = () => {
    session.clear();
    setUser(null);
  };

  // Si el backend responde 401 (token vencido/inválido), se cierra la sesión
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, []);

  const handleLogin = (token, u) => {
    session.save(token, u);
    setUser(u);
  };

  return (
    <div className="container">
      <header>
        <h1>🍽️ Reseñas de restaurantes</h1>
        {user && (
          <div className="user-box">
            <span>Hola, <strong>{user.nombre}</strong></span>
            <button className="btn secondary small" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      <main>{user ? <Reviews /> : <Login onLogin={handleLogin} />}</main>
    </div>
  );
}
