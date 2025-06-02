// src/dashboard/pages/ModeratorDashboard.jsx
import React, { useEffect, useState } from 'react';
import moderatorService from '../../services/moderatorService';
import './ModeratorDashboard.css';

export default function ModeratorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await moderatorService.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load moderator stats.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading stats...</div>;
  if (!stats) return <div>No data available.</div>;

  return (
    <div className="mod-dashboard">
      <h2>Moderator Dashboard</h2>
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Pending Reports</h3>
          <p>{stats.pendingReports}</p>
        </div>
        <div className="stat-card">
          <h3>Total Topics</h3>
          <p>{stats.totalTopics}</p>
        </div>
        {/* ...nếu có thêm card khác, thêm vào */}
      </div>
    </div>
  );
}
