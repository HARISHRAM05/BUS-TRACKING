// "My bus": the rider saves their usual route and boarding stop once, then sees when the next bus
// reaches that stop (timetable-based, India time) and how far the bus is from the stop right now.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meApi, routeApi, getErrorMessage, getFieldErrors } from '../services/api';
import { useToast } from '../context/ToastContext';
import { countdownText, to12h } from '../utils/format';
import { SelectField } from './FormField';

const MyRouteCard = () => {
  const toast = useToast();
  const [data, setData] = useState(undefined); // undefined = loading, null = nothing saved yet
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ routeId: '', stopName: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () =>
      meApi
        .next()
        .then((d) => {
          setData(d);
          setError('');
        })
        .catch((err) => setError(getErrorMessage(err))),
    []
  );

  // Refresh every 30 seconds so the countdown stays right
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const openEditor = () => {
    setErrors({});
    setForm({ routeId: data?.route?._id || '', stopName: data?.stopName || '' });
    setEditing(true);
    if (routes.length === 0) routeApi.list().then(setRoutes).catch((err) => toast.error(getErrorMessage(err)));
  };

  const stops = [...(routes.find((r) => r._id === form.routeId)?.stops || [])].sort((a, b) => a.order - b.order);

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.routeId) errs.routeId = 'Select your route';
    if (!form.stopName) errs.stopName = 'Select your boarding stop';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const { message } = await meApi.setRoute(form);
      toast.success(message);
      setEditing(false);
      load();
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      const { message } = await meApi.clearRoute();
      toast.success(message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="card mb-3 my-bus-card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h2 className="h6 fw-bold mb-0">
            <i className="bi bi-geo-alt-fill me-2 text-ku" />
            My bus
          </h2>
          {!editing && data && (
            <div className="btn-group btn-group-sm">
              <button className="btn btn-outline-primary" onClick={openEditor}>Change</button>
              <button className="btn btn-outline-secondary" onClick={remove} title="Remove saved route">
                <i className="bi bi-x-lg" />
              </button>
            </div>
          )}
        </div>

        {error && <div className="alert alert-danger py-2 small mb-2">{error}</div>}

        {editing ? (
          <form onSubmit={save} noValidate>
            <div className="row">
              <div className="col-md-6">
                <SelectField
                  label="Your route"
                  name="routeId"
                  value={form.routeId}
                  onChange={(e) => setForm({ routeId: e.target.value, stopName: '' })}
                  error={errors.routeId}
                  placeholder="Select a route"
                  options={routes.map((r) => ({ value: r._id, label: `${r.routeCode} - ${r.routeName}` }))}
                />
              </div>
              <div className="col-md-6">
                <SelectField
                  label="Where you board"
                  name="stopName"
                  value={form.stopName}
                  onChange={(e) => setForm((f) => ({ ...f, stopName: e.target.value }))}
                  error={errors.stopName}
                  placeholder={form.routeId ? 'Select your stop' : 'Pick a route first'}
                  disabled={!form.routeId}
                  options={stops.map((s) => ({ value: s.stopName, label: `${s.order}. ${s.stopName} (${to12h(s.pickupTime)})` }))}
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm" disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-2" />}
                Save
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : data === undefined ? (
          <div className="text-muted small">
            <span className="spinner-border spinner-border-sm me-2" />
            Loading your bus...
          </div>
        ) : data === null ? (
          <div className="d-md-flex align-items-center justify-content-between gap-3">
            <p className="text-muted small mb-2 mb-md-0">
              Save your usual route and boarding stop to see exactly when your next bus arrives.
            </p>
            <button className="btn btn-primary btn-sm text-nowrap" onClick={openEditor}>
              <i className="bi bi-plus-lg me-1" />
              Set my route
            </button>
          </div>
        ) : (
          <>
            <p className="small mb-2">
              <Link to={`/routes/${data.route._id}`} className="text-decoration-none">
                <span className="badge bg-ku me-1">{data.route.routeCode}</span>
                {data.route.routeName}
              </Link>
              <span className="text-muted"> · boarding at </span>
              <strong>{data.stopName}</strong>
            </p>

            {data.stopMissing ? (
              <div className="alert alert-warning py-2 small mb-0">
                Your saved stop is no longer on this route. Press <strong>Change</strong> to pick it again.
              </div>
            ) : data.departures.length === 0 ? (
              <p className="text-muted small mb-0">No upcoming buses found in the timetable for this stop.</p>
            ) : (
              <>
                <ul className="list-group list-group-flush">
                  {data.departures.map((d, i) => {
                    const countdown = countdownText(d.minutesUntil);
                    return (
                      <li
                        key={`${d.dayLabel}-${d.time}-${d.direction}`}
                        className={`list-group-item px-0 d-flex justify-content-between align-items-center gap-2 ${i === 0 ? 'next-bus-first' : ''}`}
                      >
                        <span>
                          <i className={`bi ${d.shift === 'Morning' ? 'bi-sunrise text-warning' : 'bi-sunset text-danger'} me-2`} />
                          <strong className={i === 0 ? 'fs-5' : ''}>{to12h(d.time)}</strong>
                          <span className="text-muted small ms-2">
                            {d.dayLabel} · {d.direction}
                            {d.bus ? ` · ${d.bus.busNumber}` : ''}
                          </span>
                        </span>
                        <span className={`badge ${i === 0 ? 'bg-ku' : 'text-bg-light border'}`}>
                          {countdown || `${d.dayLabel}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {data.live && (
                  <p className="small mt-2 mb-0">
                    <i className="bi bi-bus-front me-1 text-ku" />
                    Bus <strong>{data.live.busNumber}</strong> is about <strong>{data.live.distanceKm} km</strong> from {data.stopName} right now
                    {data.live.source === 'simulated' && <span className="text-muted"> (demo position)</span>}.
                  </p>
                )}
                <p className="form-text mb-0">Evening times at your stop are estimated from the morning timetable.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyRouteCard;
