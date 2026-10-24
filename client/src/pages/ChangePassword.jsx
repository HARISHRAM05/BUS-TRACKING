import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, getErrorMessage, getFieldErrors } from '../services/api';
import { useAuth, homePathFor } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateChangePassword } from '../utils/validation';
import useForm from '../utils/useForm';
import { PasswordField } from '../components/FormField';
import PasswordChecklist from '../components/PasswordChecklist';

const INITIAL = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

const ChangePassword = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { values, errors, setErrors, handleChange, reset } = useForm(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateChangePassword(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { message } = await authApi.changePassword(values);
      toast.success(message);
      reset();
      navigate(homePathFor(user));
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card auth-card mx-auto">
        <div className="card-body p-4 p-md-5">
          <h1 className="h4 fw-bold text-ku mb-1">
            <i className="bi bi-key me-2" />
            Change password
          </h1>
          <p className="text-muted small mb-4">Signed in as {user.email}</p>
          <form onSubmit={handleSubmit} noValidate>
            <PasswordField
              label="Current password"
              name="currentPassword"
              value={values.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              autoComplete="current-password"
              required
            />
            <PasswordField
              label="New password"
              name="newPassword"
              value={values.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              autoComplete="new-password"
              required
            />
            <PasswordChecklist password={values.newPassword} />
            <PasswordField
              label="Confirm new password"
              name="confirmNewPassword"
              value={values.confirmNewPassword}
              onChange={handleChange}
              error={errors.confirmNewPassword}
              autoComplete="new-password"
              required
            />
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button className="btn btn-primary flex-grow-1" disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2" />}
                Update password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
