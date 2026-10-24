// All page routes. ProtectedRoute decides who can open which page.
import { Route, Routes } from 'react-router-dom';
import AppNavbar from './components/AppNavbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute, { GuestOnlyRoute } from './routes/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';
import AdminHome from './pages/admin/AdminHome';
import Operations from './pages/admin/Operations';
import UserManagement from './pages/admin/UserManagement';
import UserDashboard from './pages/user/UserDashboard';
import RouteDetail from './pages/user/RouteDetail';
import LiveMap from './pages/user/LiveMap';

const App = () => (
  <>
    <ScrollToTop />
    <AppNavbar />
    <main>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Only for visitors who are not logged in */}
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Any logged-in user (Admin or User) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/routes/:id" element={<RouteDetail />} />
          <Route path="/track" element={<LiveMap />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/operations" element={<Operations />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </>
);

export default App;
