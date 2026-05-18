import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import BriefSimplifier from './pages/BriefSimplifier';
import ResultsPremium from './pages/ResultsPremium';
import Credits from './pages/Credits';
import RubricSimplifier from './pages/RubricSimplifier';
import EssayScorer from './pages/EssayScorer';
import Humaniser from './pages/Humaniser';
import AssessmentScaffolder from './pages/AssessmentScaffolder';
import CoursePlanner from './pages/CoursePlanner';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Onboarding from './pages/Onboarding';
import HiddenCurriculumDecoder from './pages/HiddenCurriculumDecoder';
import ExecutiveFunctionPlanner from './pages/ExecutiveFunctionPlanner';
import ConceptVisualiser from './pages/ConceptVisualiser';
import WeeklyDigest from './pages/WeeklyDigest';
import SavedOutputs from './pages/SavedOutputs';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import StudyBuddy from './components/StudyBuddy';
import FeedbackDashboard from './pages/FeedbackDashboard';
import LabPage from './pages/LabPage';
import { Toaster } from 'sonner';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(location.state?.user ? true : null);

  useEffect(() => {
    if (location.state?.user) {
      setIsAuthenticated(true);
      return;
    }

    if (!loading) {
      setIsAuthenticated(user !== null);
    }
  }, [user, loading, location.state]);

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-4 text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (user) {
    const isNewUser = localStorage.getItem('simplifii_new_user');
    if (isNewUser) {
      localStorage.removeItem('simplifii_new_user');
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Router Component
const AppRouter = () => {
  const location = useLocation();

  // CRITICAL: Check for session_id in hash BEFORE any route rendering
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      <Route 
        path="/login" 
        element={<Navigate to="/" replace />}
      />
      
      <Route path="/auth-callback" element={<AuthCallback />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/brief-simplifier"
        element={
          <ProtectedRoute>
            <BriefSimplifier />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/results/:briefId"
        element={
          <ProtectedRoute>
            <ResultsPremium />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/rubric-simplifier"
        element={
          <ProtectedRoute>
            <RubricSimplifier />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/essay-scorer"
        element={
          <ProtectedRoute>
            <EssayScorer />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/humaniser"
        element={
          <ProtectedRoute>
            <Humaniser />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/assessment-scaffolder"
        element={
          <ProtectedRoute>
            <AssessmentScaffolder />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/course-planner"
        element={
          <ProtectedRoute>
            <CoursePlanner />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/credits"
        element={
          <ProtectedRoute>
            <Credits />
          </ProtectedRoute>
        }
      />
      
      <Route path="/about" element={<About />} />
      <Route path="/faq" element={<FAQ />} />
      
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/hidden-curriculum"
        element={
          <ProtectedRoute>
            <HiddenCurriculumDecoder />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/executive-planner"
        element={
          <ProtectedRoute>
            <ExecutiveFunctionPlanner />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/concept-visualiser"
        element={
          <ProtectedRoute>
            <ConceptVisualiser />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/weekly-digest"
        element={
          <ProtectedRoute>
            <WeeklyDigest />
          </ProtectedRoute>
        }
      />
      
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/saved-outputs"
        element={
          <ProtectedRoute>
            <SavedOutputs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/saved-outputs/:historyId"
        element={
          <ProtectedRoute>
            <SavedOutputs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback-dashboard"
        element={
          <ProtectedRoute>
            <FeedbackDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lab"
        element={
          <ProtectedRoute>
            <LabPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <AppRouter />
          <StudyBuddy />
          <Toaster position="bottom-right" theme="dark" richColors />
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
