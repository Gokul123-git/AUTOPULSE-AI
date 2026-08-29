import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from './api';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import RolesPage from './pages/RolesPage';
import VehiclesPage from './pages/VehiclesPage';
import MaintenancePage from './pages/MaintenancePage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import VehicleProfilePage from './pages/VehicleProfilePage';
import AssessmentPage from './pages/AssessmentPage';
import TrackingPage from './pages/TrackingPage';
import InspectionPage from './pages/InspectionPage';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  return localStorage.getItem('autopulse-token') ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

function App() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const signedIn = Boolean(localStorage.getItem('autopulse-token'));

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/auth/logout');
    } catch (_) {
      /* Always clear browser session */
    }
    localStorage.removeItem('autopulse-token');
    localStorage.removeItem('autopulse-refresh-token');
    localStorage.removeItem('autopulse-user');
    localStorage.removeItem('autopulse-restored-data');
    setLoggingOut(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Sleek Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-2xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-400/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </span>
            <span className="bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
              AutoPulse <span className="text-cyan-400 font-extrabold text-sm tracking-wider uppercase ml-0.5">AI</span>
            </span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-400">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Analytics
            </NavLink>
            <NavLink
              to="/vehicles"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Fleet Vehicles
            </NavLink>
            <NavLink
              to="/maintenance"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Predictive Maintenance
            </NavLink>
            <NavLink
              to="/pricing"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Pricing
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              About
            </NavLink>
            <NavLink
              to="/faq"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              FAQ
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Contact
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? 'text-cyan-300 border-b-2 border-cyan-400 pb-1' : 'hover:text-white transition-colors'
              }
            >
              Admin Portal
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {signedIn ? (
              <button
                onClick={logout}
                disabled={loggingOut}
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:opacity-60"
              >
                {loggingOut ? 'Signing Out…' : 'Sign Out'}
              </button>
            ) : (
              <NavLink
                to="/login"
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all hover:scale-105"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
        <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleProfilePage /></ProtectedRoute>} />
        <Route path="/vehicles/:id/assessment" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
        <Route path="/vehicles/:id/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
        <Route path="/vehicles/:id/inspection" element={<ProtectedRoute><InspectionPage /></ProtectedRoute>} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-slate-950 px-6 py-8 text-center text-xs text-slate-400">
        AutoPulse AI Platform · Enterprise-Grade Predictive Vehicle Telematics & Diagnostics · Built for College & Placement Portfolio Excellence
      </footer>
    </div>
  );
}

export default App;
