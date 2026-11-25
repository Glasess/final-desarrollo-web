import StarRating from './StarRating.jsx';

// Las fechas se guardan a medianoche UTC: se muestran en UTC para que no "retrocedan" un día
const toDisplayDate = (iso) =>
  new Date(iso).toLocaleDateString('es-CO', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });

export default function ReviewCard({ review, onEdit, onDelete, editing }) {
  return (
    <li className={`card review ${editing ? 'is-editing' : ''}`}>
      <div className="review-head">
        <strong>{review.nombreRestaurante}</strong>
        <StarRating value={review.calificacion} />
      </div>
      <small className="muted">Visita: {toDisplayDate(review.fechaVisita)}</small>
      {review.observaciones && <p className="obs">{review.observaciones}</p>}
      <div className="actions">
        <button className="btn secondary small" onClick={() => onEdit(review)}>
          Editar
        </button>
        <button className="btn danger small" onClick={() => onDelete(review)}>
          Eliminar
        </button>
      </div>
    </li>
  );
}
