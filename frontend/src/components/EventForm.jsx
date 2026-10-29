import { useState } from 'react';
import { CATEGORIES, STATUSES, toLocalInput } from '../utils/helpers';
import { required, validateAll } from '../utils/validators';

const EMPTY = {
  title: '', description: '', category: 'Technical', date: '', startTime: '', endTime: '',
  venue: '', organizer: '', posterUrl: '', capacity: 50, registrationDeadline: '', status: 'upcoming',
};

const RULES = {
  title: (v) => required(v, 'Title'),
  description: (v) => required(v, 'Description'),
  date: (v) => required(v, 'Date'),
  startTime: (v) => required(v, 'Start time'),
  endTime: (v, all) => required(v, 'End time') || (all.startTime && v <= all.startTime ? 'End time must be after start time' : ''),
  venue: (v) => required(v, 'Venue'),
  organizer: (v) => required(v, 'Organizer'),
  capacity: (v) => (Number(v) >= 1 ? '' : 'Capacity must be at least 1'),
  registrationDeadline: (v, all) =>
    required(v, 'Registration deadline') ||
    (all.date && new Date(v) > new Date(`${all.date}T${all.endTime || '23:59'}`) ? 'Deadline must be before the event ends' : ''),
  posterUrl: (v) => (!v || /^https?:\/\/\S+$/i.test(v) ? '' : 'Poster must be an http(s) URL'),
};

export default function EventForm({ initial, onSubmit, submitting, submitLabel = 'Save event' }) {
  const [values, setValues] = useState(
    initial
      ? { ...EMPTY, ...initial, date: initial.date.slice(0, 10), registrationDeadline: toLocalInput(initial.registrationDeadline) }
      : EMPTY
  );
  const [errors, setErrors] = useState({});

  const set = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validateAll(values, RULES);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit({
      ...values,
      capacity: Number(values.capacity),
      date: new Date(`${values.date}T00:00:00Z`).toISOString(), // stored as UTC midnight
      registrationDeadline: new Date(values.registrationDeadline).toISOString(),
    });
  };

  // Small helper to keep each field's label/error wiring consistent and accessible.
  const field = (name, label, props = {}, children) => (
    <div className={`field ${props.wide ? 'wide' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {props.as === 'select' ? (
        <select id={name} name={name} value={values[name]} onChange={set} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-err` : undefined}>
          {children}
        </select>
      ) : props.as === 'textarea' ? (
        <textarea id={name} name={name} rows={5} value={values[name]} onChange={set} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-err` : undefined} />
      ) : (
        <input id={name} name={name} value={values[name]} onChange={set} type={props.type || 'text'} min={props.min} placeholder={props.placeholder} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-err` : undefined} />
      )}
      {errors[name] && <p className="field-error" id={`${name}-err`} role="alert">{errors[name]}</p>}
    </div>
  );

  return (
    <form className="form-card form-grid" onSubmit={handleSubmit} noValidate>
      {field('title', 'Title', { wide: true })}
      {field('description', 'Description', { wide: true, as: 'textarea' })}
      {field('category', 'Category', { as: 'select' }, CATEGORIES.map((c) => <option key={c}>{c}</option>))}
      {field('status', 'Status', { as: 'select' }, STATUSES.map((s) => <option key={s}>{s}</option>))}
      {field('date', 'Event date', { type: 'date' })}
      {field('registrationDeadline', 'Registration deadline', { type: 'datetime-local' })}
      {field('startTime', 'Start time', { type: 'time' })}
      {field('endTime', 'End time', { type: 'time' })}
      {field('venue', 'Venue')}
      {field('organizer', 'Organizer')}
      {field('capacity', 'Capacity', { type: 'number', min: 1 })}
      {field('posterUrl', 'Poster image URL (optional)', { placeholder: 'https://...' })}
      <div className="form-actions wide">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
