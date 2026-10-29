import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import Loader from '../components/Loader';
import { ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate, formatDateTime } from '../utils/helpers';

const TABS = ['all', 'registered', 'attended', 'cancelled'];

export default function MyRegistrations() {
  const toast = useToast();
  const [regs, setRegs] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/registrations/my')
      .then((res) => setRegs(res.data.registrations))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [toast]);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async () => {
    setBusy(true);
    try {
      await api.delete(`/registrations/${target.event._id}`);
      toast.success('Registration cancelled.');
      setTarget(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader fullPage />;
  const shown = tab === 'all' ? regs : regs.filter((r) => r.status === tab);

  return (
    <div className="container section">
      <h1>My registrations</h1>
      <div className="tabs" role="tablist" aria-label="Filter registrations">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Your event registrations</caption>
            <thead>
              <tr><th scope="col">Event</th><th scope="col">Date</th><th scope="col">Venue</th><th scope="col">Registered</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id}>
                  <td><Link to={`/events/${r.event._id}`}>{r.event.title}</Link></td>
                  <td>{formatDate(r.event.date)}</td>
                  <td>{r.event.venue}</td>
                  <td>{formatDateTime(r.registeredAt)}</td>
                  <td><span className={`badge badge-inline badge-reg-${r.status}`}>{r.status}</span></td>
                  <td>
                    {r.status === 'registered' && ['upcoming', 'ongoing'].includes(r.event.status) && (
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setTarget(r)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Nothing here yet. <Link to="/events">Browse events</Link></p>
      )}

      <ConfirmModal
        open={Boolean(target)}
        title="Cancel registration?"
        message={target ? `Cancel your seat for "${target.event.title}"?` : ''}
        confirmLabel="Yes, cancel"
        danger
        busy={busy}
        onConfirm={cancel}
        onClose={() => setTarget(null)}
      />
    </div>
  );
}
