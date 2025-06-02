// src/components/Dashboard/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
// Đường dẫn chính xác tới useAuth.js
import useAuth from '../../auth/hooks/useAuth';
import './Sidebar.css';

export default function Sidebar() {
  const { roles } = useAuth();
  const isMod = roles.includes('ROLE_MODERATOR');
  const isAdmin = roles.includes('ROLE_ADMIN');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Dashboard</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end>
          Home
        </NavLink>

        {(isMod || isAdmin) && (
          <NavLink to="/dashboard/reports">Reports</NavLink>
        )}

        {isMod && (
          <>
            <NavLink to="/dashboard/categories">Categories</NavLink>
            <NavLink to="/dashboard/topics">Topics</NavLink>
            <NavLink to="/dashboard/chat">Chat Support</NavLink>
          </>
        )}

        {isAdmin && (
          <>
            <NavLink to="/dashboard/users">Users</NavLink>
            <NavLink to="/dashboard/articles">Articles</NavLink>
            <NavLink to="/dashboard/system">System Info</NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
