/**
 * Main app: Routes for Feed, EventDetails, EventForm, Login.
 */
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Feed from './pages/Feed';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import Help from './pages/Help';
import { RequireAuth, useSession } from './SessionContext';

function RootRedirect() {
  const { signedIn } = useSession();
  return <Navigate to={signedIn ? '/feed' : '/login'} replace />;
}

function App() {
  const { pathname } = useLocation();
  const hideHeader = pathname === '/login' || pathname === '/signup';
  return (
    <div className="min-h-screen bg-page flex flex-col">
      {!hideHeader && <Header />}
      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/feed"
            element={
              <RequireAuth>
                <Feed />
              </RequireAuth>
            }
          />
          <Route
            path="/event/new"
            element={
              <RequireAuth>
                <CreateEvent />
              </RequireAuth>
            }
          />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route
            path="/event/:id/edit"
            element={
              <RequireAuth>
                <CreateEvent />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="/help" element={<Help />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
