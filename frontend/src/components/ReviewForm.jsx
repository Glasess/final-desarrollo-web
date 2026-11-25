import { useEffect, useState } from 'react';
import StarRating from './StarRating.jsx';

const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ nombreRestaurante: '', calificacion: 0, fechaVisita: todayStr(), observaciones: '' });

// Formulario para crear o editar. Si recibe "initial" está en modo edición.
export default function ReviewForm({ initial, onSubmit, onCancel, saving, error }) {
  const [form, setForm] = useState(initial || emptyForm());
  const [localError, setLocalError] = useState('');

  // Cuando cambia la reseña a editar, se recarga el formulario
  useEffect(() => {
    setForm(initial || emptyForm());
    setLocalError('');
  }, [initial]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.calificacion) {
      setLocalError('Elige una calificación de 1 a 5 estrellas');
      return;
    }
    setLocalError('');
    const ok = await onSubmit({ ...form, nombreRestaurante: form.nombreRestaurante.trim() });
    if (ok && !initial) setForm(emptyForm());
  };

  const msg = localError || error;

  return (
    <form className="card" onSubmit={submit} noValidate={false}>
      <h2>{initial ? 'Editar reseña' : 'Nueva reseña'}</h2>

      <label>
        Restaurante
        <input
          name="nombreRestaurante"
          value={form.nombreRestaurante}
          onChange={change}
          maxLength={120}
          placeholder="Ej: La Trattoria"
          required
        />
      </label>

      <div className="field">
        <span className="field-label">Calificación</span>
        <StarRating value={form.calificacion} onChange={(n) => setForm({ ...form, calificacion: n })} />
      </div>

      <label>
        Fecha de visita
        <input
          type="date"
          name="fechaVisita"
          value={form.fechaVisita}
          onChange={change}
          max={todayStr()}
          required
        />
      </label>

      <label>
        Observaciones <span className="muted">({form.observaciones.length}/1000)</span>
        <textarea
          name="observaciones"
          rows={3}
          value={form.observaciones}
          onChange={change}
          maxLength={1000}
          placeholder="¿Qué pediste? ¿Cómo fue el servicio?"
        />
      </label>

      {msg && <p className="error" role="alert">{msg}</p>}

      <div className="actions">
        <button className="btn" disabled={saving}>
          {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar reseña'}
        </button>
        {initial && (
          <button type="button" className="btn secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
