import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import Loader from '../components/Loader';
import { ConfirmModal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime } from '../utils/helpers';

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [regs, setRegs] = useState([]);
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

  const upcoming = regs.filter((r) => r.status === 'registered' && ['upcoming', 'ongoing'].includes(r.event.status));
  const history = regs.filter((r) => !upcoming.includes(r));
  const attended = regs.filter((r) => r.status === 'attended').length;

  return (
    <div className="container section">
      <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
      <p className="muted">{user.department || 'Student'}{user.rollNumber ? ` · ${user.rollNumber}` : ''}</p>

      <div className="stat-cards">
        <div className="stat-card"><span>Upcoming</span><strong>{upcoming.length}</strong></div>
        <div className="stat-card"><span>Attended</span><strong>{attended}</strong></div>
        <div className="stat-card"><span>Total registrations</span><strong>{regs.length}</strong></div>
      </div>

      <section aria-labelledby="up-title" className="panel">
        <h2 id="up-title">Upcoming events</h2>
        {upcoming.length ? (
          <ul className="list">
            {upcoming.map((r) => (
              <li key={r._id} className="list-item">
                <div>
                  <Link to={`/events/${r.event._id}`} className="list-title">{r.event.title}</Link>
                  <p className="muted">{formatDate(r.event.date)} · {formatTime(r.event.startTime)} · {r.event.venue}</p>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setTarget(r)}>Cancel</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">You have no upcoming registrations. <Link to="/events">Find an event</Link></p>
        )}
      </section>

      <section aria-labelledby="hist-title" className="panel">
        <h2 id="hist-title">History</h2>
        {history.length ? (
          <ul className="list">
            {history.map((r) => (
              <li key={r._id} className="list-item">
                <div>
                  <Link to={`/events/${r.event._id}`} className="list-title">{r.event.title}</Link>
                  <p className="muted">{formatDate(r.event.date)} · {r.event.category}</p>
                </div>
                <span className={`badge badge-inline badge-reg-${r.status}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No past activity yet.</p>
        )}
      </section>

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
