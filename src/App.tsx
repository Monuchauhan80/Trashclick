import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import MainLayout from './components/layouts/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import './index.css';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, isLoading } = useUser();
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return user ? <>{element}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isLoading } = useUser();
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="report" element={<ProtectedRoute element={<ReportPage />} />} />
        <Route path="profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App; 