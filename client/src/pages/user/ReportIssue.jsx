// Riders report problems (late bus, overcrowding, breakdown, safety, lost item) and follow the reply
import { useCallback, useEffect, useState } from 'react';
import { issueApi, routeApi, getErrorMessage, getFieldErrors } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import useForm from '../../utils/useForm';
import { validateReport } from '../../utils/validation';
import { ISSUE_CATEGORIES, ISSUE_STATUS_BADGE, formatDateTime } from '../../utils/format';
import { SelectField, TextAreaField } from '../../components/FormField';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const EMPTY = { category: '', route: '', message: '' };

const ReportIssue = () => {
  const toast = useToast();
  const { values, errors, setErrors, handleChange, reset } = useForm(EMPTY);
  const [routes, setRoutes] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadMine = useCallback(
    () =>
      issueApi
        .mine()
        .then(setMine)
        .catch((err) => toast.error(getErrorMessage(err)))
        .finally(() => setLoading(false)),
    [toast]
  );

  useEffect(() => {
    routeApi.list().then(setRoutes).catch(() => setRoutes([]));
    loadMine();
  }, [loadMine]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateReport(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { message } = await issueApi.create({ ...values, route: values.route || null });
      toast.success(message);
      reset();
      loadMine();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="h3 fw-bold text-ku mb-1">Report a problem</h1>
      <p className="text-muted">Tell the Transport Office about a late bus, overcrowding, a breakdown, a safety concern or lost property.</p>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit} noValidate>
                <SelectField
                  label="What is it about?"
                  name="category"
                  value={values.category}
                  onChange={handleChange}
                  error={errors.category}
                  placeholder="Select a category"
                  options={ISSUE_CATEGORIES}
                  required
                />
                <SelectField
                  label="Which route? (optional)"
                  name="route"
                  value={values.route}
                  onChange={handleChange}
                  error={errors.route}
                  placeholder="Not about one route"
                  options={routes.map((r) => ({ value: r._id, label: `${r.routeCode} - ${r.routeName}` }))}
                />
                <TextAreaField
                  label="What happened?"
                  name="message"
                  rows={5}
                  maxLength={600}
                  value={values.message}
                  onChange={handleChange}
                  error={errors.message}
                  placeholder="e.g. The 7:05 AM bus at Ukkadam came 20 minutes late today."
                  required
                />
                <button className="btn btn-primary w-100" disabled={submitting}>
                  {submitting && <span className="spinner-border spinner-border-sm me-2" />}
                  <i className="bi bi-send me-1" />
                  Send report
                </button>
              </form>
              <p className="form-text mt-3 mb-0">
                In an emergency, call the driver or the Transport Office directly. Reports are read during office hours.
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <h2 className="h6 fw-bold mb-3">My reports</h2>
          {loading ? (
            <Loader />
          ) : mine.length === 0 ? (
            <div className="card">
              <EmptyState icon="bi-flag" title="No reports yet" message="Reports you send will appear here with the Transport Office's reply." />
            </div>
          ) : (
            mine.map((r) => (
              <div className="card mb-2" key={r._id}>
                <div className="card-body py-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
                    <span>
                      <strong>{r.category}</strong>
                      {r.route && <span className="badge bg-ku ms-2">{r.route.routeCode}</span>}
                    </span>
                    <span className={`badge ${ISSUE_STATUS_BADGE[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="small mb-1">{r.message}</p>
                  <div className="small text-muted">Sent {formatDateTime(r.createdAt)}</div>
                  {r.adminNote && (
                    <div className="alert alert-light border small mt-2 mb-0 py-2">
                      <i className="bi bi-reply me-1 text-ku" />
                      <strong>Transport Office:</strong> {r.adminNote}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
