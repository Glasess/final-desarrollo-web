import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login(email.trim(), password)
        : await api.register(nombre.trim(), email.trim(), password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    setError('');
    setPassword('');
    setMode(isLogin ? 'register' : 'login');
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
      <p className="muted lead">
        {isLogin ? 'Entra para ver y administrar tus reseñas.' : 'Regístrate para guardar tus reseñas.'}
      </p>

      {!isLogin && (
        <label>
          Nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            autoComplete="name"
            required
          />
        </label>
      )}
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          minLength={6}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          required
        />
        {!isLogin && <small className="muted">Mínimo 6 caracteres</small>}
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn" disabled={loading}>
        {loading ? 'Enviando...' : isLogin ? 'Entrar' : 'Registrarme'}
      </button>

      <p className="switch">
        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button type="button" className="link" onClick={toggle}>
          {isLogin ? 'Regístrate' : 'Inicia sesión'}
        </button>
      </p>
    </form>
  );
}
