// src/dashboard/pages/ReportsPage.jsx
import React, { useEffect, useState } from 'react';
import reportService from '../../services/reportService'; 
import useAuth from '../../auth/hooks/useAuth';
import './ReportsPage.css';

export default function ReportsPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes('ROLE_ADMIN');
  const isMod = roles.includes('ROLE_MODERATOR');

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await reportService.getPendingReportsForAdmin();
        setReports(res.data);
      } else if (isMod) {
        const res = await reportService.getPendingReportsForMod();
        setReports(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReview = async (reportId, action) => {
    try {
      if (isAdmin) {
        await reportService.reviewReportAsAdmin(reportId, action);
      } else {
        await reportService.reviewReportAsMod(reportId, action);
      }
      alert('Action successful');
      fetchReports();
    } catch (err) {
      console.error(err);
      alert('Failed to review report.');
    }
  };

  if (loading) return <div>Loading reports...</div>;
  if (!reports.length) return <div>No pending reports.</div>;

  return (
    <div className="reports-page">
      <h2>Pending Reports</h2>
      <table className="reports-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Post Snippet</th>
            <th>Author</th>
            <th>Reported By</th>
            <th>Reason</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.postSnippet}</td>
              <td>{report.postAuthorUsername}</td>
              <td>{report.reportedByUsername}</td>
              <td>{report.reason || '-'}</td>
              <td>{new Date(report.createdAt).toLocaleString()}</td>
              <td>
                <button
                  onClick={() => handleReview(report.id, 'DELETE_POST')}
                  className="btn-delete"
                >
                  Delete Post
                </button>
                <button
                  onClick={() => handleReview(report.id, 'IGNORE')}
                  className="btn-ignore"
                >
                  Ignore
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
