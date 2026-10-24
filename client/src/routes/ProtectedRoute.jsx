// Guards pages on the frontend:
//  - not logged in            -> send to /login
//  - logged in, wrong role    -> send to that user's own home page
// (The backend ALSO checks roles, so hiding a page here is not the only protection.)
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homePathFor } from '../context/AuthContext';
import Loader from '../components/Loader';

const ProtectedRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />;

  return <Outlet />;
};

// For /login and /signup: logged-in users are sent to their home page
export const GuestOnlyRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loader text="Checking your session..." />;
  return user ? <Navigate to={homePathFor(user)} replace /> : <Outlet />;
};

export default ProtectedRoute;
