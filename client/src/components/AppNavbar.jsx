// Role-based navbar: shows different links for guests, Admins and Users
import { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LogoSlot from './LogoSlot';

const ADMIN_LINKS = [
  { to: '/admin', label: 'Home', icon: 'bi-speedometer2', end: true },
  { to: '/admin/operations', label: 'Operations', icon: 'bi-gear-wide-connected' },
  { to: '/admin/users', label: 'Users', icon: 'bi-people' },
  { to: '/track', label: 'Live Map', icon: 'bi-map' },
  { to: '/dashboard', label: 'User View', icon: 'bi-eye' },
];
const USER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid' },
  { to: '/track', label: 'Live Map', icon: 'bi-map' },
];

const AppNavbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Close the mobile menu after navigating to another page
  useEffect(() => {
    document.getElementById('mainNav')?.classList.remove('show');
    document.querySelector('.navbar-toggler')?.classList.add('collapsed');
  }, [pathname, user]);

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out');
    navigate('/login');
  };

  const links = !user ? [] : isAdmin ? ADMIN_LINKS : USER_LINKS;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-ku sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to={user ? homePathFor(user) : '/'}>
          {/* LOGO SLOT - see components/LogoSlot.jsx */}
          <LogoSlot height={34} light />
          <span className="lh-sm">
            <span className="fw-bold brand-title">Karunya Bus Tracking Portal</span>
            <small className="d-none d-sm-block opacity-75" style={{ fontSize: '0.7rem' }}>
              Transport Office · Karunya Nagar, Coimbatore
            </small>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            {links.map((l) => (
              <li className="nav-item" key={l.to}>
                <NavLink className="nav-link" to={l.to} end={l.end}>
                  <i className={`bi ${l.icon} me-1`} />
                  {l.label}
                </NavLink>
              </li>
            ))}

            {!user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item ms-lg-2">
                  <Link className="btn btn-light btn-sm text-ku fw-semibold" to="/signup">Sign Up</Link>
                </li>
              </>
            )}

            {user && (
              <li className="nav-item dropdown ms-lg-2">
                <button
                  className="btn btn-link nav-link dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-person-circle me-1" />
                  {user.name.split(' ')[0]}
                  <span className="badge bg-light text-ku ms-2">{user.role === 'Admin' ? 'Admin' : user.userType}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li className="dropdown-item-text small text-muted">{user.email}</li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" to="/change-password">
                      <i className="bi bi-key me-2" />Change Password
                    </Link>
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2" />Logout
                    </button>
                  </li>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
