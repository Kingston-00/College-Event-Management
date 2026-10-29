import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container section not-found">
      <p className="big-404" aria-hidden="true">404</p>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
