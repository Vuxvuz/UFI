/**
 * Dashboard-specific permissions for admin and moderator roles
 */

// Define all possible dashboard permissions
const permissions = {
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  CHANGE_ROLES: 'change_roles',
  VIEW_POSTS: 'view_posts',
  MANAGE_POSTS: 'manage_posts',
  VIEW_REPORTS: 'view_reports',
  HANDLE_REPORTS: 'handle_reports',
  MANAGE_LIVE_CHAT: 'manage_live_chat',
  VIEW_CONTENT: 'view_content',
  MANAGE_CONTENT: 'manage_content',
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_SYSTEM: 'view_system',
  MANAGE_SYSTEM: 'manage_system',
  DATABASE_ACCESS: 'database_access',
  DEPLOY_CODE: 'deploy_code'
};

// Assign permissions to roles
const rolePermissions = {
  admin: [
    permissions.VIEW_USERS,
    permissions.MANAGE_USERS,
    permissions.CHANGE_ROLES,
    permissions.VIEW_POSTS,
    permissions.MANAGE_POSTS,
    permissions.VIEW_REPORTS,
    permissions.HANDLE_REPORTS,
    permissions.MANAGE_LIVE_CHAT,
    permissions.VIEW_CONTENT,
    permissions.MANAGE_CONTENT,
    permissions.VIEW_ANALYTICS,
    permissions.VIEW_SYSTEM,
    permissions.MANAGE_SYSTEM,
    permissions.DATABASE_ACCESS,
    permissions.DEPLOY_CODE
  ],
  moder: [
    permissions.VIEW_USERS,
    permissions.VIEW_POSTS,
    permissions.MANAGE_POSTS,
    permissions.VIEW_REPORTS,
    permissions.HANDLE_REPORTS,
    permissions.MANAGE_LIVE_CHAT,
    permissions.VIEW_CONTENT,
    permissions.MANAGE_CONTENT
  ]
};

// Utility function to check if a role has a specific permission
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  return rolePermissions[role]?.includes(permission) || false;
};

// Utility function to get all permissions for a role
export const getPermissionsForRole = (role) => {
  return rolePermissions[role] || [];
};

// Export permissions constants
export { permissions, rolePermissions }; 