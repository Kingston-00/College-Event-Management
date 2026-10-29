import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storage } from '../utils/helpers';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.set('cems_theme', theme);
  }, [theme]);

  const close = () => setOpen(false);
  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main navigation">
        <Link to="/" className="brand" onClick={close}>
          <span aria-hidden="true">🎓</span> CampusEvents
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>

        <ul id="nav-menu" className={`nav-menu ${open ? 'open' : ''}`}>
          <li><NavLink to="/" end onClick={close}>Home</NavLink></li>
          <li><NavLink to="/events" onClick={close}>Events</NavLink></li>
          <li><a href="/about.html">About</a></li>
          {user && !isAdmin && (
            <>
              <li><NavLink to="/dashboard" onClick={close}>Dashboard</NavLink></li>
              <li><NavLink to="/my-registrations" onClick={close}>My Registrations</NavLink></li>
            </>
          )}
          {isAdmin && (
            <>
              <li><NavLink to="/admin" end onClick={close}>Admin</NavLink></li>
              <li><NavLink to="/admin/events" onClick={close}>Manage Events</NavLink></li>
            </>
          )}
          <li className="nav-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user ? (
              <>
                <span className="nav-user" title={user.email}>{user.name.split(' ')[0]}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={close}>Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>Sign up</Link>
              </>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
