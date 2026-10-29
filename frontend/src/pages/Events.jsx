import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api/axios';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import SearchFilterBar from '../components/SearchFilterBar';

const PAGE_SIZE = 9;

export default function Events() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({
    q: '', category: params.get('category') || '', status: '', from: '', to: '', sort: 'date',
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ events: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Changing any filter resets to the first page.
  const updateFilters = useCallback((patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const query = Object.fromEntries(Object.entries({ ...filters, page, limit: PAGE_SIZE }).filter(([, v]) => v !== ''));
    api
      .get('/events', { params: query })
      .then((res) => !cancelled && (setData(res.data), setError('')))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters, page]);

  return (
    <div className="container section">
      <h1>Events</h1>
      <SearchFilterBar filters={filters} onChange={updateFilters} />

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {loading ? (
        <Loader label="Loading events..." />
      ) : data.events.length ? (
        <>
          <p className="result-count" aria-live="polite">{data.total} event{data.total === 1 ? '' : 's'} found</p>
          <div className="card-grid">{data.events.map((e) => <EventCard key={e._id} event={e} />)}</div>
          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>&larr; Prev</button>
              <span>Page {data.page} of {data.pages}</span>
              <button type="button" className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next &rarr;</button>
            </nav>
          )}
        </>
      ) : (
        !error && <div className="empty"><p>No events match your filters.</p></div>
      )}
    </div>
  );
}
