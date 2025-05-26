import React, { useState, useEffect } from 'react';
import { hasPermission } from '../../utils/permissionUtils';
import { Navigate } from 'react-router-dom';

export default function UserManagement() {
  // Check permissions
  if (!hasPermission('users:manage')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // Mock data for demonstration
  useEffect(() => {
    // This would normally be an API call
    setTimeout(() => {
      setUsers([
        { id: 1, name: 'John Smith', email: 'john@example.com', role: 'user', status: 'active', joinDate: '2023-01-15' },
        { id: 2, name: 'Alice Johnson', email: 'alice@example.com', role: 'moderator', status: 'active', joinDate: '2023-02-20' },
        { id: 3, name: 'Robert Lee', email: 'robert@example.com', role: 'user', status: 'inactive', joinDate: '2023-03-10' },
        { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'admin', status: 'active', joinDate: '2022-11-05' },
        { id: 5, name: 'Michael Brown', email: 'michael@example.com', role: 'user', status: 'pending', joinDate: '2023-05-22' },
      ]);
      setLoading(false);
    }, 800);
  }, []);
  
  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
  
  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    if (!hasPermission('users:changeRole')) {
      alert('You do not have permission to change user roles');
      return;
    }
    
    // Update local state (would be an API call in real implementation)
    setUsers(users.map(user => 
      user.id === userId ? {...user, role: newRole} : user
    ));
  };
  
  // Handle status change
  const handleStatusChange = async (userId, newStatus) => {
    if (!hasPermission('users:changeStatus')) {
      alert('You do not have permission to change user status');
      return;
    }
    
    // Update local state (would be an API call in real implementation)
    setUsers(users.map(user => 
      user.id === userId ? {...user, status: newStatus} : user
    ));
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        {hasPermission('users:create') && (
          <button className="btn btn-primary">
            <i className="bi bi-person-plus me-2"></i>
            Add New User
          </button>
        )}
      </div>
      
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-12 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <select 
                className="form-select" 
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        {hasPermission('users:changeRole') ? (
                          <select 
                            className="form-select form-select-sm"
                            value={user.role}
                            onChange={e => handleRoleChange(user.id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            user.role === 'admin' ? 'bg-danger' : 
                            user.role === 'moderator' ? 'bg-info' : 'bg-secondary'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td>
                        {hasPermission('users:changeStatus') ? (
                          <select 
                            className="form-select form-select-sm"
                            value={user.status}
                            onChange={e => handleStatusChange(user.id, e.target.value)}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="pending">Pending</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            user.status === 'active' ? 'bg-success' : 
                            user.status === 'pending' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {user.status}
                          </span>
                        )}
                      </td>
                      <td>{new Date(user.joinDate).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-secondary">
                            <i className="bi bi-eye"></i>
                          </button>
                          {hasPermission('users:edit') && (
                            <button className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                          {hasPermission('users:delete') && (
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 