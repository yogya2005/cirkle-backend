// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import GroupsPage from './components/Groups/GroupsPage';
import GroupDetails from './components/Groups/GroupDetails';
import { Box, CircularProgress, CssBaseline } from '@mui/material';

// Placeholder components for testing - you'll implement these later
const Dashboard = () => <div>Dashboard</div>;
const Documents = () => <div>Documents</div>;
const Files = () => <div>Files</div>;

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Auth wrapper to check if user is logged in and redirect accordingly
const AuthWrapper = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // DEVELOPMENT MODE: Always redirect to login page
  // For production, uncomment the line below and comment out the current return statement
  // return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Root path - automatically redirects based on auth status */}
          <Route path="/" element={<AuthWrapper />} />
          
          {/* Login route - accessible to everyone */}
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard route - protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Groups routes - protected */}
          <Route path="/groups" element={
            <ProtectedRoute>
              <GroupsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/groups/:groupId" element={
            <ProtectedRoute>
              <GroupDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/documents" element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          } />
          
          <Route path="/files" element={
            <ProtectedRoute>
              <Files />
            </ProtectedRoute>
          } />
          
          {/* Catch all for unmatched routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;