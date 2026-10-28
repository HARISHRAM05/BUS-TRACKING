// View-only dashboard for students & staff (admins can open it too via "User View")
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { busApi, routeApi, scheduleApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../utils/useDebounce';
import { BUS_STATUS_BADGE, DAYS, formatDays, to12h } from '../../utils/format';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import MyRouteCard from '../../components/MyRouteCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const EMPTY_FILTERS = { search: '', stop: '', bus: '', shift: '', direction: '', day: '' };
const TODAY = DAYS[(new Date().getDay() + 6) % 7]; // JS: 0 = Sunday

// Remove empty values so they aren't sent as query params
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v && String(v).trim()));

const UserDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('routes');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debounced = useDebounce(filters);
  const [data, setData] = useState({ routes: [], schedules: [], buses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const f = debounced;
    setLoading(true);
    setError('');
    Promise.all([
      routeApi.list(clean({ search: f.search, stop: f.stop, bus: f.bus })),
      scheduleApi.list(clean(f)),
      busApi.list(clean({ search: f.bus })),
    ])
      .then(([routes, schedules, buses]) => setData({ routes, schedules, buses }))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debounced]);

  const setFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const hasFilters = Object.values(filters).some(Boolean);

  const TABS = [
    { key: 'routes', label: 'Routes', icon: 'bi-signpost-split', count: data.routes.length },
    { key: 'schedules', label: 'Schedules', icon: 'bi-calendar-week', count: data.schedules.length },
    { key: 'buses', label: 'Buses', icon: 'bi-bus-front', count: data.buses.length },
  ];

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h1 className="h3 fw-bold text-ku mb-1">Bus Routes & Timings</h1>
        <p className="text-muted mb-0">
          Hello {user.name.split(' ')[0]}! Find your college bus between Coimbatore and Karunya Nagar campus.
        </p>
      </div>

      <AnnouncementBanner />
      <MyRouteCard />

      {/* ---------- Filters ---------- */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label small mb-1">Route name / code</label>
              <input className="form-control" name="search" value={filters.search} onChange={setFilter} placeholder="e.g. Gandhipuram or R01" maxLength={50} />
            </div>
            <div className="col-md-4">
              <label className="form-label small mb-1">Stop name</label>
              <input className="form-control" name="stop" value={filters.stop} onChange={setFilter} placeholder="e.g. Ukkadam" maxLength={50} />
            </div>
            <div className="col-md-4">
              <label className="form-label small mb-1">Bus number</label>
              <input className="form-control" name="bus" value={filters.bus} onChange={setFilter} placeholder="e.g. KU-03" maxLength={50} />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small mb-1">Shift</label>
              <select className="form-select" name="shift" value={filters.shift} onChange={setFilter}>
                <option value="">Any</option>
                <option>Morning</option>
                <option>Evening</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small mb-1">Direction</label>
              <select className="form-select" name="direction" value={filters.direction} onChange={setFilter}>
                <option value="">Any</option>
                <option>To Campus</option>
                <option>From Campus</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label small mb-1">Day</label>
              <select className="form-select" name="day" value={filters.day} onChange={setFilter}>
                <option value="">Any day</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}{d === TODAY ? ' (today)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3 d-flex align-items-end gap-2">
              <button className="btn btn-outline-primary flex-grow-1" onClick={() => setFilters((f) => ({ ...f, day: TODAY }))}>
                Today
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters} title="Clear filters">
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>
          <div className="form-text">Shift, direction and day filter the Schedules tab.</div>
        </div>
      </div>

      {/* ---------- Tabs ---------- */}
      <ul className="nav nav-pills mb-3 gap-1">
        {TABS.map((t) => (
          <li className="nav-item" key={t.key}>
            <button className={`nav-link ${tab === t.key ? 'active bg-ku' : 'text-ku'}`} onClick={() => setTab(t.key)}>
              <i className={`bi ${t.icon} me-1`} />
              {t.label}
              <span className={`badge ms-2 ${tab === t.key ? 'bg-light text-ku' : 'bg-ku-light text-ku'}`}>{t.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <Loader />
      ) : (
        <>
          {tab === 'routes' && <RoutesGrid routes={data.routes} />}
          {tab === 'schedules' && <SchedulesTable schedules={data.schedules} />}
          {tab === 'buses' && <BusesTable buses={data.buses} />}
        </>
      )}
    </div>
  );
};

// ---------- Sub-components (view only, no edit/delete controls) ----------

const RoutesGrid = ({ routes }) =>
  routes.length === 0 ? (
    <div className="card">
      <EmptyState icon="bi-signpost-split" title="No routes match" message="Try a different route, stop or bus number." />
    </div>
  ) : (
    <div className="row g-3">
      {routes.map((r) => (
        <div className="col-md-6 col-lg-4" key={r._id}>
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge bg-ku">{r.routeCode}</span>
                <span className="small text-muted">{r.distanceKm} km</span>
              </div>
              <h2 className="h6 fw-bold mb-1">{r.routeName}</h2>
              <p className="small text-muted mb-2">
                <i className="bi bi-geo-alt me-1" />
                {r.startPoint} → {r.endPoint}
              </p>
              <p className="small mb-2">
                <i className="bi bi-clock me-1 text-ku" />
                First pickup <strong>{to12h(r.stops[0]?.pickupTime)}</strong> · {r.stops.length} stops
              </p>
              <p className="small mb-3 text-truncate" title={r.stops.map((s) => s.stopName).join(' → ')}>
                {r.stops.map((s) => s.stopName).join(' → ')}
              </p>
              <div className="mt-auto d-flex justify-content-between align-items-center">
                <span className="small">
                  <i className="bi bi-bus-front me-1" />
                  {r.assignedBus ? r.assignedBus.busNumber : <span className="text-muted">No bus assigned</span>}
                </span>
                <Link to={`/routes/${r._id}`} className="btn btn-sm btn-outline-primary">
                  View details <i className="bi bi-arrow-right" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

const SchedulesTable = ({ schedules }) => (
  <div className="card">
    {schedules.length === 0 ? (
      <EmptyState icon="bi-calendar-x" title="No schedules match" message="Try another shift, direction or day." />
    ) : (
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Route</th>
              <th>Shift</th>
              <th>Direction</th>
              <th>Departs</th>
              <th>Arrives</th>
              <th>Bus</th>
              <th>Days</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s._id}>
                <td>
                  <Link to={`/routes/${s.route?._id}`} className="text-decoration-none">
                    <span className="badge bg-ku me-1">{s.route?.routeCode}</span>
                    <span className="small">{s.route?.routeName}</span>
                  </Link>
                </td>
                <td>
                  <i className={`bi ${s.shift === 'Morning' ? 'bi-sunrise text-warning' : 'bi-sunset text-danger'} me-1`} />
                  {s.shift}
                </td>
                <td className="small">{s.direction}</td>
                <td className="fw-semibold">{to12h(s.departureTime)}</td>
                <td>{to12h(s.arrivalTime)}</td>
                <td>{s.bus?.busNumber}</td>
                <td className="small">{formatDays(s.daysOfOperation)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const BusesTable = ({ buses }) => (
  <div className="card">
    {buses.length === 0 ? (
      <EmptyState icon="bi-bus-front" title="No buses match" message="Check the bus number and try again." />
    ) : (
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Bus No</th>
              <th>Registration</th>
              <th>Capacity</th>
              <th>Driver</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b._id}>
                <td className="fw-semibold">{b.busNumber}</td>
                <td>{b.registrationNo}</td>
                <td>{b.capacity} seats</td>
                <td>{b.driverName}</td>
                <td><a href={`tel:${b.driverPhone}`}>{b.driverPhone}</a></td>
                <td><span className={`badge ${BUS_STATUS_BADGE[b.status]}`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default UserDashboard;
