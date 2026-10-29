// Form validation helpers. Each returns an error string, or '' when valid.

export const required = (value, label = 'This field') =>
  String(value ?? '').trim() ? '' : `${label} is required`;

export const validateEmail = (value) => {
  if (!String(value ?? '').trim()) return 'Email is required';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address';
};

export const validatePassword = (value) => {
  if (!value) return 'Password is required';
  return value.length >= 6 ? '' : 'Password must be at least 6 characters';
};

export const validatePhone = (value) =>
  !value || /^[0-9+\-\s]{7,15}$/.test(value) ? '' : 'Enter a valid phone number';

/** Runs a { field: validatorFn } map over values; returns { field: message } for failures only. */
export function validateAll(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, rule]) => {
    const message = rule(values[field], values);
    if (message) errors[field] = message;
  });
  return errors;
}
