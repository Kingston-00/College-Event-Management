import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import { CATEGORIES } from '../utils/helpers';

const ICONS = { Technical: '💻', Cultural: '🎭', Sports: '🏆', Workshop: '🛠️', Seminar: '🎤', Other: '✨' };

/** Animates a number from 0 to `target` once. */
function Counter({ target }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const steps = 30;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setValue(Math.round((target * i) / steps));
      if (i >= steps) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{value}</>;
}

export default function Home() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, seats: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events', { params: { status: 'upcoming', sort: 'date', limit: 3 } }),
      api.get('/events', { params: { limit: 50 } }),
    ])
      .then(([upcoming, all]) => {
        setEvents(upcoming.data.events);
        setStats({
          total: all.data.total,
          upcoming: upcoming.data.total,
          seats: all.data.events.reduce((sum, e) => sum + e.registeredCount, 0),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <p className="eyebrow">Your campus. Your events.</p>
          <h1 id="hero-title">Discover, register and never miss a college event</h1>
          <p className="hero-sub">From hackathons to cultural fests - find what's happening and reserve your seat in seconds.</p>
          <div className="hero-actions">
            <Link to="/events" className="btn btn-light btn-lg">Browse events</Link>
            <Link to="/register" className="btn btn-outline-light btn-lg">Join now</Link>
          </div>
        </div>
      </section>

      <section className="container stats-row" aria-label="Statistics">
        <div className="stat-tile"><strong><Counter target={stats.total} />+</strong><span>Events hosted</span></div>
        <div className="stat-tile"><strong><Counter target={stats.upcoming} /></strong><span>Upcoming now</span></div>
        <div className="stat-tile"><strong><Counter target={stats.seats} />+</strong><span>Seats booked</span></div>
        <div className="stat-tile"><strong><Counter target={CATEGORIES.length} /></strong><span>Categories</span></div>
      </section>

      <section className="container section" aria-labelledby="upcoming-title">
        <div className="section-head">
          <h2 id="upcoming-title">Upcoming highlights</h2>
          <Link to="/events">View all &rarr;</Link>
        </div>
        {loading ? (
          <Loader />
        ) : events.length ? (
          <div className="card-grid">{events.map((e) => <EventCard key={e._id} event={e} />)}</div>
        ) : (
          <p className="empty">No upcoming events yet. Check back soon!</p>
        )}
      </section>

      <section className="container section" aria-labelledby="cat-title">
        <h2 id="cat-title">Browse by category</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/events?category=${c}`} className={`category-tile cat-${c}`}>
              <span aria-hidden="true">{ICONS[c]}</span>
              {c}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
