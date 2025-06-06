import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme/theme';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// App Pages
import Dashboard from './pages/Dashboard';
import WorkoutLog from './pages/WorkoutLog';
import WorkoutHistory from './pages/WorkoutHistory';
import WorkoutDetails from './pages/WorkoutDetails';
import WorkoutEdit from './pages/WorkoutEdit';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Icons (keeping for future use)
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
// import HistoryIcon from '@mui/icons-material/History';
// import ShowChartIcon from '@mui/icons-material/ShowChart';
// import PersonIcon from '@mui/icons-material/Person';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="log-workout" element={<WorkoutLog />} />
        <Route path="workouts" element={<WorkoutHistory />} />
        <Route path="workouts/:id" element={<WorkoutDetails />} />
        <Route path="workouts/:id/edit" element={<WorkoutEdit />} />
        <Route path="progress" element={<Progress />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 404 - Keep at the bottom */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
