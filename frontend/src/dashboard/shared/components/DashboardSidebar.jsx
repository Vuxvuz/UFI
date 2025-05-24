import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { hasPermission, permissions } from '../utils/permissions';

function DashboardSidebar({ userRole }) {
  const location = useLocation();
  
  // Determine if a link is active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };
  
  // Navigation links grouped by section with permission checks
  const navigationLinks = [
    // Admin section
    {
      title: 'Admin',
      requiresPermission: permissions.CHANGE_ROLES,
      links: [
        { 
          name: 'User Management', 
          path: '/dashboard/admin/users', 
          icon: 'users',
          requiresPermission: permissions.MANAGE_USERS
        },
        { 
          name: 'Role Management', 
          path: '/dashboard/admin/roles', 
          icon: 'key',
          requiresPermission: permissions.CHANGE_ROLES
        }
      ]
    },
    // Moderation section
    {
      title: 'Moderation',
      requiresPermission: permissions.MANAGE_POSTS,
      links: [
        { 
          name: 'Forum Management', 
          path: '/moder/forum', 
          icon: 'message-square',
          requiresPermission: permissions.MANAGE_POSTS
        },
        { 
          name: 'Reports', 
          path: '/dashboard/mod/reports', 
          icon: 'flag',
          requiresPermission: permissions.HANDLE_REPORTS
        },
        { 
          name: 'Live Support', 
          path: '/dashboard/mod/chat', 
          icon: 'message-circle',
          requiresPermission: permissions.MANAGE_LIVE_CHAT
        },
        { 
          name: 'Category Management', 
          path: '/dashboard/mod/categories', 
          icon: 'tag',
          requiresPermission: permissions.MANAGE_POSTS
        }
      ]
    },
    // Content section
    {
      title: 'Content',
      requiresPermission: permissions.VIEW_CONTENT,
      links: [
        { 
          name: 'Health Articles', 
          path: '/dashboard/mod/articles', 
          icon: 'file-text',
          requiresPermission: permissions.MANAGE_CONTENT
        },
        { 
          name: 'Health Sources', 
          path: '/dashboard/mod/sources', 
          icon: 'link',
          requiresPermission: permissions.MANAGE_CONTENT
        }
      ]
    },
    // Development section
    {
      title: 'Development',
      requiresPermission: permissions.VIEW_SYSTEM,
      links: [
        { 
          name: 'System Status', 
          path: '/dashboard/dev/system', 
          icon: 'activity',
          requiresPermission: permissions.VIEW_SYSTEM
        },
        { 
          name: 'Database', 
          path: '/dashboard/dev/database', 
          icon: 'database',
          requiresPermission: permissions.DATABASE_ACCESS
        },
        { 
          name: 'Deployment', 
          path: '/dashboard/dev/deployment', 
          icon: 'upload',
          requiresPermission: permissions.DEPLOY_CODE
        }
      ]
    },
    // Analytics section
    {
      title: 'Analytics',
      requiresPermission: permissions.VIEW_ANALYTICS,
      links: [
        { 
          name: 'Usage Statistics', 
          path: '/dashboard/analytics/usage', 
          icon: 'bar-chart',
          requiresPermission: permissions.VIEW_ANALYTICS
        },
        { 
          name: 'User Engagement', 
          path: '/dashboard/analytics/engagement', 
          icon: 'users',
          requiresPermission: permissions.VIEW_ANALYTICS
        }
      ]
    }
  ];
  
  // Function to render the icon based on name
  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'key':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
          </svg>
        );
      case 'message-square':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      case 'flag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        );
      case 'message-circle':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        );
      case 'file-text':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
      case 'link':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        );
      case 'activity':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        );
      case 'database':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
        );
      case 'upload':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        );
      case 'bar-chart':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        );
      case 'tag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
    }
  };

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white">
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <div className="mt-2 flex items-center">
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded">
            {userRole}
          </span>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 py-2">
          <Link to="/dashboard" className={`flex items-center px-4 py-2 text-gray-300 rounded ${isActive('/dashboard') && !isActive('/dashboard/') ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Overview
          </Link>
        </div>
        
        {navigationLinks.map((section, index) => (
          // Only show section if user has permission
          hasPermission(userRole, section.requiresPermission) && (
            <div key={index} className="mt-4">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              
              {section.links.map((link, linkIndex) => (
                // Only show link if user has permission
                hasPermission(userRole, link.requiresPermission) && (
                  <Link 
                    key={linkIndex}
                    to={link.path}
                    className={`flex items-center px-4 py-2 mt-2 text-sm text-gray-300 rounded mx-4 ${
                      isActive(link.path) ? 'bg-gray-700 text-white' : 'hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3">{renderIcon(link.icon)}</span>
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          )
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-64 border-t border-gray-700">
        <div className="px-8 py-4">
          <Link to="/" className="flex items-center text-sm text-gray-300 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Back to Site
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default DashboardSidebar; 