import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { isAdmin } from './utils/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SlotRequests from './pages/SlotRequests';
import Logs from './pages/Logs';
import NavBar from './components/common/NavBar';

const ProtectedRoute = ({ children }) => {
  return isAdmin() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-accent">
        {isAdmin() && <NavBar />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/slot-requests"
            element={
              <ProtectedRoute>
                <SlotRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <Logs />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;