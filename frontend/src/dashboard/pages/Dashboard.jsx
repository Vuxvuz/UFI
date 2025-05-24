// src/dashboard/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import DashboardSidebar from '../shared/components/DashboardSidebar';
import { hasPermission, permissions } from '../shared/utils/permissions';
import ForumManagement from '../components/ForumManagement';
import CategoryManagement from '../components/CategoryManagement';

// Import placeholder components - these would be replaced with actual components
const Placeholder = ({ title }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <p>This component will be implemented soon.</p>
  </div>
);

// Dashboard Overview component
const DashboardOverview = ({ userRole, stats }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
    
    {/* Stats Cards - showing them only to roles that would find them useful */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      {(userRole === 'admin' || userRole === 'dev') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">Total Users</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>
      )}
      
      {(userRole === 'admin' || userRole === 'moder' || userRole === 'dev') && (
        <>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-500 text-sm">Forum Posts</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats?.totalPosts || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-gray-500 text-sm">Total Topics</h2>
                <p className="text-2xl font-semibold text-gray-800">{stats?.totalTopics || 0}</p>
              </div>
            </div>
          </div>
        </>
      )}
      
      {(userRole === 'admin' || userRole === 'dev') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-500 text-sm">New Users Today</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats?.newUsersToday || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

function Dashboard() {
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminStats, setAdminStats] = useState({});
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/dashboard/login');
        return;
      }
      
      try {
        const response = await axios.get('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const { role } = response.data.data;
        setUserRole(role);
        
        // Check if user has permission to access dashboard (only admin and moder)
        if (!['admin', 'moder'].includes(role)) {
          // Redirect unauthorized users to homepage
          navigate('/');
          return;
        }
        
        // Fetch dashboard statistics
        fetchAdminStats();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        setError('Authentication failed. Please login again.');
        setIsLoading(false);
        // Redirect to login page on auth error
        navigate('/dashboard/login');
      }
    };
    
    // Fetch dashboard statistics
    const fetchAdminStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('/api/admin/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAdminStats(response.data.data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />
      
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <Routes>
            {/* Dashboard home */}
            <Route path="/" element={<DashboardOverview userRole={userRole} stats={adminStats} />} />
            
            {/* Admin routes */}
            <Route 
              path="/admin/users" 
              element={
                hasPermission(userRole, permissions.MANAGE_USERS) 
                  ? <Placeholder title="User Management" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/admin/roles" 
              element={
                hasPermission(userRole, permissions.CHANGE_ROLES) 
                  ? <Placeholder title="Role Management" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            
            {/* Moderation routes */}
            <Route 
              path="/mod/forum" 
              element={
                hasPermission(userRole, permissions.MANAGE_POSTS) 
                  ? <ForumManagement userRole={userRole} /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/mod/categories" 
              element={
                hasPermission(userRole, permissions.MANAGE_POSTS) 
                  ? <CategoryManagement /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/mod/articles" 
              element={
                hasPermission(userRole, permissions.MANAGE_CONTENT) 
                  ? <Placeholder title="Health Articles" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/mod/sources" 
              element={
                hasPermission(userRole, permissions.MANAGE_CONTENT) 
                  ? <Placeholder title="Health Sources" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            
            {/* Analytics routes */}
            <Route 
              path="/analytics/usage" 
              element={
                hasPermission(userRole, permissions.VIEW_ANALYTICS) 
                  ? <Placeholder title="Usage Statistics" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/analytics/engagement" 
              element={
                hasPermission(userRole, permissions.VIEW_ANALYTICS) 
                  ? <Placeholder title="User Engagement" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            
            {/* Development routes */}
            <Route 
              path="/dev/system" 
              element={
                hasPermission(userRole, permissions.VIEW_SYSTEM) 
                  ? <Placeholder title="System Status" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/dev/database" 
              element={
                hasPermission(userRole, permissions.DATABASE_ACCESS) 
                  ? <Placeholder title="Database Management" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            <Route 
              path="/dev/deployment" 
              element={
                hasPermission(userRole, permissions.DEPLOY_CODE) 
                  ? <Placeholder title="Deployment" /> 
                  : <Navigate to="/dashboard" replace />
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
