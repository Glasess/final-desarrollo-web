import { useState } from 'react';

const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

// Modo editable (onChange) o solo lectura (sin onChange)
export default function StarRating({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  const editable = typeof onChange === 'function';
  const shown = hover || value;

  if (!editable) {
    return (
      <span className="stars" role="img" aria-label={`${value} de 5 estrellas`}>
        {'★'.repeat(value)}
        <span className="stars-off">{'★'.repeat(5 - value)}</span>
      </span>
    );
  }

  return (
    <div className="star-input" onMouseLeave={() => setHover(0)}>
      <div role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            className={`star-btn ${n <= shown ? 'on' : ''}`}
            style={{ fontSize: size }}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
      </div>
      <small className="muted">{LABELS[shown] || 'Elige una calificación'}</small>
    </div>
  );
}
