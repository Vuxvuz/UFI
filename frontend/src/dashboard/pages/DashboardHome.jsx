import React, { useState, useEffect } from 'react';
import { hasPermission } from '../../utils/permissionUtils';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTopics: 0,
    totalPosts: 0,
    newUsersToday: 0
  });
  
  useEffect(() => {
    // This would normally fetch from API, but we're using mock data
    setStats({
      totalUsers: 1250,
      activeUsers: 438,
      totalTopics: 86,
      totalPosts: 3427,
      newUsersToday: 12
    });
  }, []);

  return (
    <div>
      <div className="row mb-4">
        <div className="col-12 col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Total Users</h6>
              <h3 className="mb-0">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Active Users</h6>
              <h3 className="mb-0">{stats.activeUsers}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Forum Topics</h6>
              <h3 className="mb-0">{stats.totalTopics}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-lg-3 mb-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">Forum Posts</h6>
              <h3 className="mb-0">{stats.totalPosts}</h3>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        {hasPermission('users:manage') && (
          <div className="col-12 col-lg-6 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Users</h5>
                <button className="btn btn-sm btn-outline-primary">View All</button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>John Smith</td>
                        <td><span className="badge bg-secondary">User</span></td>
                        <td>Today</td>
                        <td><span className="badge bg-success">Active</span></td>
                      </tr>
                      <tr>
                        <td>Alice Johnson</td>
                        <td><span className="badge bg-info">Moderator</span></td>
                        <td>Yesterday</td>
                        <td><span className="badge bg-success">Active</span></td>
                      </tr>
                      <tr>
                        <td>Robert Lee</td>
                        <td><span className="badge bg-secondary">User</span></td>
                        <td>2 days ago</td>
                        <td><span className="badge bg-warning">Pending</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {hasPermission('forums:manage') && (
          <div className="col-12 col-lg-6 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Forum Activity</h5>
                <button className="btn btn-sm btn-outline-primary">View All</button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Topic</th>
                        <th>Author</th>
                        <th>Posts</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Getting Started Guide</td>
                        <td>Admin</td>
                        <td>24</td>
                        <td>2 hours ago</td>
                      </tr>
                      <tr>
                        <td>Feature Request: Dark Mode</td>
                        <td>John Smith</td>
                        <td>8</td>
                        <td>Yesterday</td>
                      </tr>
                      <tr>
                        <td>Help with API Integration</td>
                        <td>Alice Johnson</td>
                        <td>15</td>
                        <td>3 days ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 