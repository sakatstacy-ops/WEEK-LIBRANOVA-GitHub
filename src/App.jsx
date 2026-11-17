import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AdminBooksPage from './pages/admin/AdminBooksPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminBorrowRequestsPage from './pages/admin/AdminBorrowRequestsPage';
import BookingRequestPage from './pages/BookingRequestPage';
import LoginPage from './pages/LoginPage';
import ReadingListPage from './pages/ReadingListPage';
import WaitlistPage from './pages/WaitlistPage';

function SessionRoute({ children }) {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="state-message" role="status">Checking your session…</p>;
  }
  if (error) {
    return <p className="notice error" role="alert">{error}</p>;
  }
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function LibrarianRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'librarian' ? children : <Navigate to="/reading-list" replace />;
}

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link className="brand" to="/discover" aria-label="MaktabaLink home">
        <span className="brand-mark" aria-hidden="true">M</span>
        <span>MaktabaLink</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link to="/discover">Discover</Link>
        {user && (
          <>
            <Link to="/reading-list">Reading list</Link>
            <Link to="/waitlist">Waitlist</Link>
            <Link to="/bookings/new">Book a space</Link>
            {user.role === 'librarian' && (
              <>
                <Link to="/admin/books">Books</Link>
                <Link to="/admin/borrow-requests">Borrow requests</Link>
                <Link to="/admin/bookings">Bookings</Link>
              </>
            )}
            <span className="nav-user">{user.username}</span>
            <button className="link-button" onClick={logout} type="button">Log out</button>
          </>
        )}
        {!user && <Link className="nav-cta" to="/login">Sign in</Link>}
      </nav>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Navigation />
      <main className="page">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/reading-list" replace /> : <LoginPage />} />
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<ReadingListPage />} />
          <Route path="/reading-list" element={<SessionRoute><ReadingListPage /></SessionRoute>} />
          <Route path="/waitlist" element={<SessionRoute><WaitlistPage /></SessionRoute>} />
          <Route path="/bookings/new" element={<SessionRoute><BookingRequestPage /></SessionRoute>} />
          <Route
            path="/admin/books"
            element={<SessionRoute><LibrarianRoute><AdminBooksPage /></LibrarianRoute></SessionRoute>}
          />
          <Route
            path="/admin/borrow-requests"
            element={<SessionRoute><LibrarianRoute><AdminBorrowRequestsPage /></LibrarianRoute></SessionRoute>}
          />
          <Route
            path="/admin/bookings"
            element={<SessionRoute><LibrarianRoute><AdminBookingsPage /></LibrarianRoute></SessionRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
