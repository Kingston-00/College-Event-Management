import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import Loader from '../components/Loader';
import { ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { downloadBlob, formatDate } from '../utils/helpers';

export default function ManageEvents() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/events', { params: { page, limit: 10, sort: 'newest' } })
      .then((res) => { setEvents(res.data.events); setPages(res.data.pages); })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, toast]);
  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/events/${target._id}`);
      toast.success('Event deleted.');
      setTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = async (event) => {
    try {
      const res = await api.get(`/admin/events/${event._id}/export`, { responseType: 'blob' });
      downloadBlob(res.data, `${event.title.replace(/[^a-z0-9]+/gi, '_')}_attendees.csv`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="container section">
      <div className="section-head">
        <h1>Manage events</h1>
        <Link to="/admin/events/new" className="btn btn-primary">+ New event</Link>
      </div>

      {loading ? (
        <Loader />
      ) : events.length ? (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">All events</caption>
            <thead>
              <tr><th scope="col">Title</th><th scope="col">Category</th><th scope="col">Date</th><th scope="col">Seats</th><th scope="col">Status</th><th scope="col">Actions</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id}>
                  <td><Link to={`/events/${e._id}`}>{e.title}</Link></td>
                  <td>{e.category}</td>
                  <td>{formatDate(e.date)}</td>
                  <td>{e.registeredCount}/{e.capacity}</td>
                  <td><span className={`badge badge-inline badge-${e.status}`}>{e.status}</span></td>
                  <td className="actions">
                    <Link to={`/admin/events/${e._id}/registrations`} className="btn btn-outline btn-sm">Attendees</Link>
                    <Link to={`/admin/events/${e._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => exportCsv(e)}>CSV</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setTarget(e)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No events yet. <Link to="/admin/events/new">Create the first one</Link></p>
      )}

      {pages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>&larr; Prev</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next &rarr;</button>
        </nav>
      )}

      <ConfirmModal
        open={Boolean(target)}
        title="Delete event?"
        message={target ? `"${target.title}" and all its registrations will be permanently removed.` : ''}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={remove}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
