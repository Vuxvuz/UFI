// Utility to check user permissions based on their role
import { permissions } from '../config/permissions';

/**
 * Check if the current user has the specified permission
 * @param {string} permissionKey - The permission to check
 * @returns {boolean} - Whether the user has the permission
 */
export function hasPermission(permissionKey) {
  // Get current user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'user';
  
  // Super admin has all permissions
  if (userRole === 'superadmin') {
    return true;
  }
  
  // Check if the role exists in permissions config
  if (!permissions[userRole]) {
    return false;
  }
  
  // Check if the permission exists for this role
  return permissions[userRole].includes(permissionKey);
}

/**
 * Get all permissions for the current user
 * @returns {string[]} - Array of permission keys
 */
export function getUserPermissions() {
  const userRole = localStorage.getItem('userRole') || 'user';
  
  if (userRole === 'superadmin') {
    // Return all possible permissions for superadmin
    return Object.values(permissions).flat();
  }
  
  return permissions[userRole] || [];
} 