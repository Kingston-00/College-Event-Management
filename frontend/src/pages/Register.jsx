import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { required, validateAll, validateEmail, validatePassword, validatePhone } from '../utils/validators';

const FIELDS = [
  ['name', 'Full name', 'text', 'name'],
  ['email', 'Email', 'email', 'email'],
  ['password', 'Password', 'password', 'new-password'],
  ['confirm', 'Confirm password', 'password', 'new-password'],
  ['department', 'Department', 'text', 'off'],
  ['year', 'Year of study (1-4)', 'number', 'off'],
  ['rollNumber', 'Roll number', 'text', 'off'],
  ['phone', 'Phone', 'tel', 'tel'],
];

const RULES = {
  name: (v) => required(v, 'Name'),
  email: validateEmail,
  password: validatePassword,
  confirm: (v, all) => (v === all.password ? '' : 'Passwords do not match'),
  year: (v) => (!v || (Number(v) >= 1 && Number(v) <= 6) ? '' : 'Year must be between 1 and 6'),
  phone: validatePhone,
};

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState(Object.fromEntries(FIELDS.map(([n]) => [n, ''])));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const onChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateAll(values, RULES);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    setServerError('');
    try {
      const { confirm, ...payload } = values;
      await register(payload);
      toast.success('Account created. Welcome aboard!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="form-card auth-card wide-card" onSubmit={onSubmit} noValidate aria-labelledby="reg-title">
        <h1 id="reg-title">Create your account</h1>
        {serverError && <p className="alert alert-error" role="alert">{serverError}</p>}
        <div className="form-grid">
          {FIELDS.map(([name, label, type, auto]) => (
            <div className="field" key={name}>
              <label htmlFor={name}>{label}</label>
              <input id={name} name={name} type={type} autoComplete={auto} value={values[name]} onChange={onChange}
                aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-err` : undefined} />
              {errors[name] && <p className="field-error" id={`${name}-err`} role="alert">{errors[name]}</p>}
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Creating account...' : 'Sign up'}</button>
        <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
