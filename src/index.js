import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './frontend/landing/LandingPage';
import PrivacyPage from './frontend/landing/PrivacyPage';
import TermsPage from './frontend/landing/TermsPage';
import LoginScreen from './frontend/auth/LoginScreen';
import SignupScreen from './frontend/auth/SignupScreen';
import AppShell from './frontend/AppShell';

/**
 * PublicOnly: redirects authenticated users to /app.
 * Used for landing, login, signup pages.
 */
function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}

/**
 * RequireAuth: redirects unauthenticated users to /login.
 */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />
          <Route path="/login" element={<PublicOnly><LoginScreen /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><SignupScreen /></PublicOnly>} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Protected app routes */}
          <Route path="/app/*" element={<RequireAuth><AppShell /></RequireAuth>} />

          {/* Catch-all: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
