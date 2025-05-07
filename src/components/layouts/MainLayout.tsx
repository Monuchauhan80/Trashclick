import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import './MainLayout.css';

const MainLayout: React.FC = () => {
  const { user, logout } = useUser();

  return (
    <div className="main-layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            TrashClick
          </Link>
          
          <nav className="main-nav">
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/map">Map</Link></li>
              {user ? (
                <>
                  <li><Link to="/report">Report Waste</Link></li>
                  <li><Link to="/profile">Profile</Link></li>
                </>
              ) : null}
            </ul>
          </nav>
          
          <div className="auth-actions">
            {user ? (
              <button className="btn btn-logout" onClick={logout}>
                Log out
              </button>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-login">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} TrashClick. All rights reserved.</p>
          <div className="footer-links">
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <a href="#" target="_blank" rel="noopener noreferrer">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;