import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { validateSignup } from '../utils/validation';
import useForm from '../utils/useForm';
import { TextField, PasswordField } from '../components/FormField';
import PasswordChecklist from '../components/PasswordChecklist';

const INITIAL = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'User',
  userType: 'Student',
  registerNo: '',
  adminCode: '',
};

const Signup = () => {
  const { signup } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { values, errors, setErrors, handleChange } = useForm(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const isAdmin = values.role === 'Admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const errs = validateSignup(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    // Send only the fields relevant to the chosen role
    const payload = { ...values };
    if (isAdmin) {
      delete payload.userType;
      delete payload.registerNo;
    } else {
      delete payload.adminCode;
    }

    setSubmitting(true);
    try {
      const user = await signup(payload);
      toast.success('Account created. Welcome to the Karunya Bus Portal!');
      navigate(homePathFor(user), { replace: true });
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
          <h1 className="h4 fw-bold text-ku mb-1">Create an account</h1>
          <p className="text-muted small mb-4">For Karunya students, staff and the Transport Office.</p>

          {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {/* Role picker */}
            <div className="mb-3">
              <label className="form-label d-block">
                I am signing up as <span className="text-danger">*</span>
              </label>
              <div className="btn-group w-100" role="group">
                {[
                  { v: 'User', label: 'Student / Staff', icon: 'bi-person' },
                  { v: 'Admin', label: 'Transport Admin', icon: 'bi-shield-lock' },
                ].map((r) => (
                  <label key={r.v} className={`btn ${values.role === r.v ? 'btn-primary' : 'btn-outline-primary'}`}>
                    <input
                      type="radio"
                      className="btn-check"
                      name="role"
                      value={r.v}
                      checked={values.role === r.v}
                      onChange={handleChange}
                    />
                    <i className={`bi ${r.icon} me-1`} />
                    {r.label}
                  </label>
                ))}
              </div>
              {errors.role && <div className="text-danger small mt-1">{errors.role}</div>}
            </div>

            <TextField label="Full name" name="name" value={values.name} onChange={handleChange} error={errors.name} autoComplete="name" required />
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

            {!isAdmin && (
              <div className="row">
                <div className="col-sm-5">
                  <div className="mb-3">
                    <label className="form-label">
                      Type <span className="text-danger">*</span>
                    </label>
                    <select
                      name="userType"
                      className={`form-select ${errors.userType ? 'is-invalid' : ''}`}
                      value={values.userType}
                      onChange={handleChange}
                    >
                      <option value="Student">Student</option>
                      <option value="Staff">Staff</option>
                    </select>
                    {errors.userType && <div className="invalid-feedback">{errors.userType}</div>}
                  </div>
                </div>
                <div className="col-sm-7">
                  <TextField
                    label={values.userType === 'Staff' ? 'Staff ID (optional)' : 'Register No (optional)'}
                    name="registerNo"
                    value={values.registerNo}
                    onChange={handleChange}
                    error={errors.registerNo}
                    placeholder={values.userType === 'Staff' ? 'e.g. KITS-STF-0421' : 'e.g. URK23CS1001'}
                  />
                </div>
              </div>
            )}

            {isAdmin && (
              <PasswordField
                label="Admin signup code"
                name="adminCode"
                value={values.adminCode}
                onChange={handleChange}
                error={errors.adminCode}
                hint="Issued by the Karunya Transport Office."
                required
              />
            )}

            <PasswordField
              label="Password"
              name="password"
              value={values.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
              required
            />
            <PasswordChecklist password={values.password} />
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
            />

            <button className="btn btn-primary w-100" disabled={submitting}>
              {submitting && <span className="spinner-border spinner-border-sm me-2" />}
              Sign Up
            </button>
          </form>

          <p className="small text-center mt-4 mb-0">
            Already registered? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
