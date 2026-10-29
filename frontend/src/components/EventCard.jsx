import { Link } from 'react-router-dom';
import { formatDate, formatTime, percent } from '../utils/helpers';

const CATEGORY_ICONS = { Technical: '💻', Cultural: '🎭', Sports: '🏆', Workshop: '🛠️', Seminar: '🎤', Other: '✨' };

export default function EventCard({ event }) {
  const filled = percent(event.registeredCount, event.capacity);
  const full = event.registeredCount >= event.capacity;

  return (
    <article className="event-card">
      <Link to={`/events/${event._id}`} className="card-media" aria-label={`View ${event.title}`}>
        {event.posterUrl ? (
          <img src={event.posterUrl} alt={`Poster for ${event.title}`} loading="lazy" />
        ) : (
          <div className={`card-placeholder cat-${event.category}`} aria-hidden="true">{CATEGORY_ICONS[event.category]}</div>
        )}
        <span className={`badge badge-${event.status}`}>{event.status}</span>
      </Link>
      <div className="card-body">
        <span className="chip">{CATEGORY_ICONS[event.category]} {event.category}</span>
        <h3 className="card-title"><Link to={`/events/${event._id}`}>{event.title}</Link></h3>
        <ul className="card-meta">
          <li>📅 <time dateTime={event.date}>{formatDate(event.date)}</time> · {formatTime(event.startTime)}</li>
          <li>📍 {event.venue}</li>
        </ul>
        <div className="progress" role="progressbar" aria-valuenow={filled} aria-valuemin="0" aria-valuemax="100" aria-label="Seats filled">
          <div className={`progress-bar ${filled >= 90 ? 'hot' : ''}`} style={{ width: `${filled}%` }} />
        </div>
        <p className="card-seats">{full ? 'Fully booked' : `${event.capacity - event.registeredCount} of ${event.capacity} seats left`}</p>
      </div>
    </article>
  );
}
