import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { validateLogin } from '../utils/validation';
import useForm from '../utils/useForm';
import { TextField, PasswordField } from '../components/FormField';

const Login = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { values, errors, setErrors, handleChange } = useForm({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const errs = validateLogin(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const user = await login(values);
      toast.success(`Welcome, ${user.name}!`);
      // Admin -> /admin, User -> /dashboard (or the page they were trying to open)
      const from = location.state?.from?.pathname;
      const allowed = from && (user.role === 'Admin' || !from.startsWith('/admin'));
      navigate(allowed ? from : homePathFor(user), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card auth-card mx-auto">
        <div className="card-body p-4 p-md-5">
          <h1 className="h4 fw-bold text-ku mb-1">Login</h1>
          <p className="text-muted small mb-4">Use your registered email to access the bus portal.</p>

          {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@karunya.edu.in"
              autoComplete="email"
              required
            />
            <PasswordField
              label="Password"
              name="password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
              required
            />
            <button className="btn btn-primary w-100" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" />}
              Login
            </button>
          </form>

          <p className="small text-center mt-4 mb-0">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
