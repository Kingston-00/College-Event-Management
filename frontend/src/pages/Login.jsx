import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { validateAll, validateEmail, validatePassword } from '../utils/validators';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const onChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validateAll(values, { email: validateEmail, password: validatePassword });
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    setServerError('');
    try {
      const u = await login(values.email, values.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(location.state?.from || (u.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="form-card auth-card" onSubmit={onSubmit} noValidate aria-labelledby="login-title">
        <h1 id="login-title">Welcome back</h1>
        <p className="muted">Log in to register for events.</p>
        {serverError && <p className="alert alert-error" role="alert">{serverError}</p>}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={values.email} onChange={onChange}
            aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <p className="field-error" id="email-err" role="alert">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" value={values.password} onChange={onChange}
            aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-err' : undefined} />
          {errors.password && <p className="field-error" id="password-err" role="alert">{errors.password}</p>}
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'}</button>
        <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
