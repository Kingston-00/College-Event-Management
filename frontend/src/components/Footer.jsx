import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <strong>🎓 CampusEvents</strong>
          <p>Discover, register and manage every event on campus.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/events">Browse events</Link>
          <Link to="/register">Create account</Link>
          <a href="/about.html">About &amp; FAQ</a>
        </nav>
      </div>
      <p className="footer-copy">&copy; {new Date().getFullYear()} College Event Management System - Web Technology Project</p>
    </footer>
  );
}
