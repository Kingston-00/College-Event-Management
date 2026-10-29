import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, STATUSES, debounce } from '../utils/helpers';

/** Live search (debounced) plus category / status / sort filters. */
export default function SearchFilterBar({ filters, onChange }) {
  const [text, setText] = useState(filters.q);

  // Debounce so we don't hit the API on every keystroke.
  const emitSearch = useMemo(() => debounce((q) => onChange({ q }), 400), [onChange]);
  useEffect(() => () => emitSearch.cancel(), [emitSearch]);
  useEffect(() => { setText(filters.q); }, [filters.q]);

  return (
    <form className="filter-bar" role="search" onSubmit={(e) => e.preventDefault()}>
      <div className="field grow">
        <label htmlFor="search">Search events</label>
        <input
          id="search"
          type="search"
          placeholder="Title, organizer, venue..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            emitSearch(e.target.value);
          }}
        />
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="from">From</label>
        <input id="from" type="date" value={filters.from} onChange={(e) => onChange({ from: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="to">To</label>
        <input id="to" type="date" value={filters.to} onChange={(e) => onChange({ to: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="sort">Sort by</label>
        <select id="sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })}>
          <option value="date">Date (soonest)</option>
          <option value="-date">Date (latest)</option>
          <option value="popularity">Most popular</option>
          <option value="newest">Recently added</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>
    </form>
  );
}
