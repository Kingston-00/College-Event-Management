import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import { ConfirmModal } from '../components/Modal';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { eventStart, formatDate, formatDateTime, formatTime, getTimeParts, isRegistrationOpen, percent } from '../utils/helpers';

/** Live countdown to the event start. */
function Countdown({ event }) {
  const [parts, setParts] = useState(() => getTimeParts(eventStart(event) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setParts(getTimeParts(eventStart(event) - Date.now())), 1000);
    return () => clearInterval(id);
  }, [event]);

  if (parts.done) return <p className="countdown-done">This event has started or finished.</p>;
  return (
    <div className="countdown" role="timer" aria-label="Time until event starts">
      {[['days', parts.days], ['hours', parts.hours], ['minutes', parts.minutes], ['seconds', parts.seconds]].map(([label, n]) => (
        <div key={label} className="count-box"><strong>{String(n).padStart(2, '0')}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data.event);
      if (user && user.role === 'student') {
        const mine = await api.get('/registrations/my');
        setRegistered(mine.data.registrations.some((r) => r.event._id === id && r.status !== 'cancelled'));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const register = async () => {
    if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
    setBusy(true);
    try {
      const { data } = await api.post(`/registrations/${id}`);
      setEvent(data.event);
      setRegistered(true);
      toast.success('You are registered! See you there.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete(`/registrations/${id}`);
      if (data.event) setEvent(data.event);
      setRegistered(false);
      setConfirmCancel(false);
      toast.success('Registration cancelled.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader fullPage />;
  if (error) return <div className="container section"><p className="alert alert-error" role="alert">{error}</p><Link to="/events">&larr; Back to events</Link></div>;

  const filled = percent(event.registeredCount, event.capacity);
  const open = isRegistrationOpen(event);
  let blockedReason = '';
  if (!open) {
    if (event.status === 'cancelled' || event.status === 'completed') blockedReason = `This event is ${event.status}.`;
    else if (new Date() > new Date(event.registrationDeadline)) blockedReason = 'Registration deadline has passed.';
    else blockedReason = 'This event is full.';
  }

  return (
    <article className="container section event-detail">
      <Link to="/events" className="back-link">&larr; All events</Link>
      <div className="detail-grid">
        <div>
          {event.posterUrl && <img className="detail-poster" src={event.posterUrl} alt={`Poster for ${event.title}`} />}
          <span className="chip">{event.category}</span>
          <span className={`badge badge-inline badge-${event.status}`}>{event.status}</span>
          <h1>{event.title}</h1>
          <p className="detail-desc">{event.description}</p>
        </div>

        <aside className="detail-side" aria-label="Event information">
          <dl className="info-list">
            <div><dt>📅 Date</dt><dd><time dateTime={event.date}>{formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time></dd></div>
            <div><dt>⏰ Time</dt><dd>{formatTime(event.startTime)} - {formatTime(event.endTime)}</dd></div>
            <div><dt>📍 Venue</dt><dd>{event.venue}</dd></div>
            <div><dt>👥 Organizer</dt><dd>{event.organizer}</dd></div>
            <div><dt>⌛ Register by</dt><dd>{formatDateTime(event.registrationDeadline)}</dd></div>
          </dl>

          <div className="capacity">
            <div className="capacity-label"><span>{event.registeredCount} / {event.capacity} registered</span><span>{filled}%</span></div>
            <div className="progress" role="progressbar" aria-valuenow={filled} aria-valuemin="0" aria-valuemax="100" aria-label="Capacity filled">
              <div className={`progress-bar ${filled >= 90 ? 'hot' : ''}`} style={{ width: `${filled}%` }} />
            </div>
          </div>

          {event.status === 'upcoming' && <Countdown event={event} />}

          {isAdmin ? (
            <Link to={`/admin/events/${event._id}/registrations`} className="btn btn-primary btn-block">View attendees</Link>
          ) : registered ? (
            <>
              <p className="alert alert-success">✅ You are registered for this event.</p>
              {(event.status === 'upcoming' || event.status === 'ongoing') && (
                <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmCancel(true)}>Cancel registration</button>
              )}
            </>
          ) : open ? (
            <button type="button" className="btn btn-primary btn-block" onClick={register} disabled={busy}>
              {busy ? 'Registering...' : user ? 'Register now' : 'Log in to register'}
            </button>
          ) : (
            <p className="alert alert-warn">{blockedReason}</p>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={confirmCancel}
        title="Cancel registration?"
        message={`You will lose your seat for "${event.title}". You can register again if seats remain.`}
        confirmLabel="Yes, cancel"
        danger
        busy={busy}
        onConfirm={cancel}
        onClose={() => setConfirmCancel(false)}
      />
    </article>
  );
}
