import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import Loader from '../components/Loader';
import { useToast } from '../components/Toast';
import { formatDate, percent } from '../utils/helpers';

/** Horizontal bar chart built from plain divs - no chart library needed. */
function BarChart({ rows, label }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="bar-chart" aria-label={label}>
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bar-label">{r.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <span className="bar-value">{r.display ?? r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch((err) => toast.error(errorMessage(err)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats) return <Loader fullPage label="Loading dashboard..." />;

  return (
    <div className="container section">
      <div className="section-head">
        <h1>Admin dashboard</h1>
        <Link to="/admin/events/new" className="btn btn-primary">+ New event</Link>
      </div>

      <div className="stat-cards">
        <div className="stat-card"><span>Total events</span><strong>{stats.totalEvents}</strong></div>
        <div className="stat-card"><span>Students</span><strong>{stats.totalStudents}</strong></div>
        <div className="stat-card"><span>Active registrations</span><strong>{stats.totalRegistrations}</strong></div>
        <div className="stat-card"><span>Upcoming events</span><strong>{stats.upcomingEvents.length}</strong></div>
      </div>

      <div className="two-col">
        <section className="panel" aria-labelledby="cat-chart">
          <h2 id="cat-chart">Events by category</h2>
          <BarChart label="Events by category" rows={stats.eventsByCategory.map((c) => ({ label: c.category, value: c.count }))} />
        </section>
        <section className="panel" aria-labelledby="top-chart">
          <h2 id="top-chart">Seat fill rate (top events)</h2>
          <BarChart
            label="Seat fill rate"
            rows={stats.topEvents.map((e) => ({
              label: e.title.length > 22 ? `${e.title.slice(0, 21)}…` : e.title,
              value: percent(e.registeredCount, e.capacity),
              display: `${e.registeredCount}/${e.capacity}`,
            }))}
          />
        </section>
      </div>

      <section className="panel" aria-labelledby="upc">
        <div className="section-head"><h2 id="upc">Next up</h2><Link to="/admin/events">Manage all &rarr;</Link></div>
        {stats.upcomingEvents.length ? (
          <ul className="list">
            {stats.upcomingEvents.map((e) => (
              <li key={e._id} className="list-item">
                <div>
                  <span className="list-title">{e.title}</span>
                  <p className="muted">{formatDate(e.date)} · {e.venue} · {e.registeredCount}/{e.capacity} registered</p>
                </div>
                <Link to={`/admin/events/${e._id}/registrations`} className="btn btn-outline btn-sm">Attendees</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No upcoming events scheduled.</p>
        )}
      </section>
    </div>
  );
}
