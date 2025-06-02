// src/dashboard/pages/AdminDashboard.jsx

import React, { useEffect, useState } from 'react';
// Đường dẫn chính xác tới adminService.js
import adminService from '../../services/adminService';
// Nếu bạn chưa có CSS, bỏ import hoặc tạo file trống
// import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getDashboard(); // GET /api/admin/dashboard
        setStats(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load admin stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading stats...</div>;
  if (!stats) return <div>No data available.</div>;

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Total Articles</h3>
          <p>{stats.totalArticles}</p>
        </div>
        {/* Thêm card nếu endpoint trả thêm dữ liệu */}
      </div>
    </div>
  );
}
