import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { hasPermission } from '../../utils/permissionUtils';

export default function DashboardLayout() {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole') || 'user';
  
  // Check if user has admin dashboard access
  const hasDashboardAccess = hasPermission('dashboard:access');
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  
  if (!hasDashboardAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
          <div className="position-sticky pt-3">
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} 
                  to="/dashboard"
                >
                  <i className="bi bi-house-door me-2"></i>
                  Dashboard Home
                </Link>
              </li>
              
              {hasPermission('users:manage') && (
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname.includes('/dashboard/users') ? 'active' : ''}`} 
                    to="/dashboard/users"
                  >
                    <i className="bi bi-people me-2"></i>
                    User Management
                  </Link>
                </li>
              )}
              
              {hasPermission('content:manage') && (
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname.includes('/dashboard/content') ? 'active' : ''}`} 
                    to="/dashboard/content"
                  >
                    <i className="bi bi-file-text me-2"></i>
                    Content Management
                  </Link>
                </li>
              )}
              
              {hasPermission('forums:manage') && (
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname.includes('/dashboard/forums') ? 'active' : ''}`} 
                    to="/dashboard/forums"
                  >
                    <i className="bi bi-chat-dots me-2"></i>
                    Forum Management
                  </Link>
                </li>
              )}
              
              {hasPermission('analytics:view') && (
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname.includes('/dashboard/analytics') ? 'active' : ''}`} 
                    to="/dashboard/analytics"
                  >
                    <i className="bi bi-graph-up me-2"></i>
                    Analytics
                  </Link>
                </li>
              )}
              
              {hasPermission('settings:manage') && (
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname.includes('/dashboard/settings') ? 'active' : ''}`} 
                    to="/dashboard/settings"
                  >
                    <i className="bi bi-gear me-2"></i>
                    Settings
                  </Link>
                </li>
              )}
            </ul>
            
            <hr />
            
            <div className="px-3 mt-4 mb-3">
              <Link to="/" className="btn btn-outline-secondary w-100">
                <i className="bi bi-arrow-left me-2"></i>
                Return to Site
              </Link>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Admin Dashboard</h1>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
} 