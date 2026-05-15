import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CreatePoll from './pages/CreatePoll';
import Analytics from './pages/Analytics';
import Vote from './pages/Vote';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';

import Landing from './pages/Landing';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 font-sans antialiased text-zinc-100">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/vote/:id" element={<Vote />} />
          
          {/* Protected Routes (Require Login) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Dashboard />
              </>
            </ProtectedRoute>
          } />

          <Route path="/create" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <CreatePoll />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics/:id" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Analytics />
              </>
            </ProtectedRoute>
          } />

          {/* We will add more routes here one by one */}
        </Routes>
      </div>
      <VercelAnalytics />
    </Router>
  );
}

export default App;
