import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSetup from './components/ProfileSetup';
import JourneyDashboard from './pages/JourneyDashboard';

function AppContent() {
  const { isAuthenticated, isProfileComplete, loading } = useAuth();

  // ⏳ Global loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  console.log('🔍 Routing State:', {
    isAuthenticated,
    isProfileComplete,
  });

  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              // If already logged in, redirect based on profile status
              isProfileComplete ? (
                <Navigate to="/journey-dashboard" replace />
              ) : (
                <Navigate to="/profile-setup" replace />
              )
            ) : (
              // Not logged in, show login page
              <LoginPage />
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? (
              // If already logged in, redirect based on profile status
              isProfileComplete ? (
                <Navigate to="/journey-dashboard" replace />
              ) : (
                <Navigate to="/profile-setup" replace />
              )
            ) : (
              // Not logged in, show register page
              <RegisterPage />
            )
          }
        />

        {/* ================= PROTECTED ROUTES ================= */}

        <Route
          path="/profile-setup"
          element={
            isAuthenticated ? (
              // Logged in - check if profile already complete
              isProfileComplete ? (
                <Navigate to="/journey-dashboard" replace />
              ) : (
                <ProfileSetup />
              )
            ) : (
              // Not logged in - must login first
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/journey-dashboard"
          element={
            isAuthenticated ? (
              // Logged in - check if profile is complete
              isProfileComplete ? (
                <JourneyDashboard />
              ) : (
                <Navigate to="/profile-setup" replace />
              )
            ) : (
              // Not logged in - must login first
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= ROOT & FALLBACK ================= */}

        <Route
          path="/"
          element={
            isAuthenticated ? (
              // Logged in - redirect based on profile
              isProfileComplete ? (
                <Navigate to="/journey-dashboard" replace />
              ) : (
                <Navigate to="/profile-setup" replace />
              )
            ) : (
              // Not logged in - show login
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all other routes and redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;