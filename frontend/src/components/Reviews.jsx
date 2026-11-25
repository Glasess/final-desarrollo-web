import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import ReviewForm from './ReviewForm.jsx';
import ReviewCard from './ReviewCard.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';

const toInputDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // reseña en edición
  const [toDelete, setToDelete] = useState(null); // reseña pendiente de confirmar
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('fecha'); // fecha | nota | nombre

  const load = async () => {
    setLoadError('');
    try {
      setReviews(await api.listReviews());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // El aviso de éxito desaparece solo
  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const save = async (form) => {
    setFormError('');
    setSaving(true);
    const payload = { ...form, calificacion: Number(form.calificacion) };
    try {
      if (editing) {
        await api.updateReview(editing._id, payload);
        setEditing(null);
        setNotice('Reseña actualizada');
      } else {
        await api.createReview(payload);
        setNotice('Reseña agregada');
      }
      await load();
      return true;
    } catch (err) {
      setFormError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r) => {
    setFormError('');
    setEditing({
      _id: r._id,
      nombreRestaurante: r.nombreRestaurante,
      calificacion: r.calificacion,
      fechaVisita: toInputDate(r.fechaVisita),
      observaciones: r.observaciones || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteReview(toDelete._id);
      if (editing && editing._id === toDelete._id) setEditing(null);
      setNotice('Reseña eliminada');
      setToDelete(null);
      await load();
    } catch (err) {
      setToDelete(null);
      setLoadError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = reviews.filter((r) => !q || r.nombreRestaurante.toLowerCase().includes(q));
    const sorters = {
      fecha: (a, b) => new Date(b.fechaVisita) - new Date(a.fechaVisita),
      nota: (a, b) => b.calificacion - a.calificacion,
      nombre: (a, b) => a.nombreRestaurante.localeCompare(b.nombreRestaurante, 'es'),
    };
    return [...list].sort(sorters[sort]);
  }, [reviews, query, sort]);

  const average = reviews.length
    ? (reviews.reduce((s, r) => s + r.calificacion, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
      <ReviewForm
        initial={editing}
        onSubmit={save}
        onCancel={() => {
          setEditing(null);
          setFormError('');
        }}
        saving={saving}
        error={formError}
      />

      {notice && <div className="toast" role="status">{notice}</div>}

      <section>
        <div className="list-head">
          <h2>Mis reseñas</h2>
          {average && (
            <span className="summary">
              {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'} · promedio {average} ★
            </span>
          )}
        </div>

        {reviews.length > 1 && (
          <div className="toolbar">
            <input
              type="search"
              placeholder="Buscar restaurante..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar restaurante"
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar por">
              <option value="fecha">Más recientes</option>
              <option value="nota">Mejor calificadas</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          </div>
        )}

        {loadError && (
          <p className="error" role="alert">
            {loadError}{' '}
            <button className="link" onClick={load}>
              Reintentar
            </button>
          </p>
        )}
        {loading && <p className="muted">Cargando...</p>}
        {!loading && !loadError && reviews.length === 0 && (
          <p className="empty">Aún no tienes reseñas. ¡Agrega la primera con el formulario de arriba!</p>
        )}
        {!loading && reviews.length > 0 && visible.length === 0 && (
          <p className="muted">Ninguna reseña coincide con “{query}”.</p>
        )}

        <ul className="list">
          {visible.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              editing={editing?._id === r._id}
              onEdit={startEdit}
              onDelete={setToDelete}
            />
          ))}
        </ul>
      </section>

      {toDelete && (
        <ConfirmDialog
          title="Eliminar reseña"
          message={`¿Seguro que quieres eliminar tu reseña de “${toDelete.nombreRestaurante}”? Esta acción no se puede deshacer.`}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setToDelete(null)}
          busy={deleting}
        />
      )}
    </>
  );
}
