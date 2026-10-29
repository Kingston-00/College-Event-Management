// Plain JavaScript utilities with no DOM or React dependency.

/** Delays `fn` until `wait` ms have passed since the last call (used for live search). */
export function debounce(fn, wait = 400) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/** Event dates are stored as UTC midnight; format in UTC so the day never shifts. */
export function formatDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
}

/** "14:30" -> "2:30 PM" */
export function formatTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Combines the stored event date with its start time into a local Date. */
export function eventStart(event) {
  return new Date(`${event.date.slice(0, 10)}T${event.startTime || '00:00'}:00`);
}

/** Splits a millisecond difference into days/hours/minutes/seconds. */
export function getTimeParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
}

/** ISO string -> value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const percent = (part, whole) => (whole ? Math.min(100, Math.round((part / whole) * 100)) : 0);

export const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'];
export const STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'];

/** True when an event can still accept registrations. */
export function isRegistrationOpen(event) {
  return (
    (event.status === 'upcoming' || event.status === 'ongoing') &&
    new Date() <= new Date(event.registrationDeadline) &&
    event.registeredCount < event.capacity
  );
}

/** Saves a Blob (e.g. CSV) as a file download. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** localStorage wrappers that never throw (private mode, quota, etc.). */
export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** Decodes a JWT payload (no verification - the server does that). */
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
