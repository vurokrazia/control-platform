import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import './i18n';

// Authentication Components
import { Login } from './components/Login';
import { Register } from './components/Register';
import { PrivateRoute } from './components/PrivateRoute';
import { Dashboard } from './components/Dashboard';

// Existing Components (now protected)
import { ControlPage } from './components/ControlPage';

import './App.css';

const App: React.FC = () => {
  const { initialize } = useAuthStore();

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/control" 
            element={
              <PrivateRoute>
                <ControlPage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/mqtt" 
            element={
              <PrivateRoute>
                <ControlPage initialTab="mqtt" />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/devices" 
            element={
              <PrivateRoute>
                <ControlPage initialTab="arduino" />
              </PrivateRoute>
            } 
          />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;