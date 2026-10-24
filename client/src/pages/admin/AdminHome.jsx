// Admin landing page: what the portal can do + live stats + recent activity
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { timeAgo } from '../../utils/format';

const CAPABILITIES = [
  { icon: 'bi-bus-front', title: 'Manage buses', text: 'Add buses, update driver details and mark buses for maintenance.', to: '/admin/operations?tab=buses' },
  { icon: 'bi-signpost-split', title: 'Manage routes', text: 'Create routes with ordered stops and pickup times, and assign a bus.', to: '/admin/operations?tab=routes' },
  { icon: 'bi-calendar-week', title: 'Manage schedules', text: 'Set morning and evening trips, directions and days of operation.', to: '/admin/operations?tab=schedules' },
  { icon: 'bi-people', title: 'Manage users', text: 'Add students, staff and admins, change roles or deactivate accounts.', to: '/admin/users' },
];

const ENTITY_ICON = { Bus: 'bi-bus-front', Route: 'bi-signpost-split', Schedule: 'bi-calendar-week', User: 'bi-person', Auth: 'bi-shield-check' };

const AdminHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([dashboardApi.stats(), dashboardApi.activity(10)])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h3 fw-bold text-ku mb-1">Transport Office Dashboard</h1>
        <p className="text-muted mb-0">Welcome back, {user.name}. Here is an overview of the Karunya bus network.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <Loader text="Loading dashboard..." />
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-bus-front" label="Total buses" value={stats?.buses} sub={`${stats?.activeBuses ?? 0} active`} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-signpost-split" label="Routes" value={stats?.routes} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-calendar-week" label="Schedules" value={stats?.schedules} />
            </div>
            <div className="col-6 col-lg-3">
              <StatCard icon="bi-people" label="Users" value={stats?.users} sub={`${stats?.admins ?? 0} admin(s)`} />
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <h2 className="h5 fw-bold mb-3">What you can do</h2>
              <div className="row g-3">
                {CAPABILITIES.map((c) => (
                  <div className="col-sm-6" key={c.title}>
                    <Link to={c.to} className="card h-100 text-decoration-none text-body">
                      <div className="card-body">
                        <i className={`bi ${c.icon} fs-3 text-ku`} />
                        <h3 className="h6 fw-bold mt-2 mb-1">{c.title}</h3>
                        <p className="small text-muted mb-0">{c.text}</p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-5">
              <h2 className="h5 fw-bold mb-3">Recent activity</h2>
              <div className="card">
                {activity.length === 0 ? (
                  <EmptyState icon="bi-clock-history" title="No activity yet" message="Changes you make will appear here." />
                ) : (
                  <ul className="list-group list-group-flush">
                    {activity.map((a) => (
                      <li className="list-group-item d-flex gap-3 align-items-start" key={a._id}>
                        <i className={`bi ${ENTITY_ICON[a.entity] || 'bi-dot'} text-ku mt-1`} />
                        <div className="flex-grow-1">
                          <div className="small">{a.action}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {a.performedByName} · {timeAgo(a.timestamp)}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminHome;
