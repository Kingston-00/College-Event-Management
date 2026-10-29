import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { useToast } from './components/Toast';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import MyRegistrations from './pages/MyRegistrations';
import AdminDashboard from './pages/AdminDashboard';
import ManageEvents from './pages/ManageEvents';
import CreateEditEvent from './pages/CreateEditEvent';
import EventRegistrations from './pages/EventRegistrations';
import NotFound from './pages/NotFound';

export default function App() {
  const { expired, clearExpired } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Auto-logout notice: send the user to login with a message.
  useEffect(() => {
    if (expired) {
      toast.error('Your session expired. Please log in again.');
      clearExpired();
      navigate('/login');
    }
  }, [expired]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const admin = (el) => <ProtectedRoute role="admin">{el}</ProtectedRoute>;
  const student = (el) => <ProtectedRoute role="student">{el}</ProtectedRoute>;

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main" className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={student(<StudentDashboard />)} />
          <Route path="/my-registrations" element={student(<MyRegistrations />)} />
          <Route path="/admin" element={admin(<AdminDashboard />)} />
          <Route path="/admin/events" element={admin(<ManageEvents />)} />
          <Route path="/admin/events/new" element={admin(<CreateEditEvent />)} />
          <Route path="/admin/events/:id/edit" element={admin(<CreateEditEvent />)} />
          <Route path="/admin/events/:id/registrations" element={admin(<EventRegistrations />)} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
