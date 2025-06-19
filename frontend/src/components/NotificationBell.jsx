import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useNotification } from '../contexts/NotificationContext';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.data);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAllNotifications();
      setNotifications(response.data.data.slice(0, 5)); // Chỉ hiển thị 5 thông báo mới nhất
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      fetchUnreadCount();
      fetchNotifications();
      showToast('Đã đánh dấu đã đọc', 'success');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showToast('Không thể đánh dấu đã đọc', 'error');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchUnreadCount();
      fetchNotifications();
      showToast('Đã đánh dấu tất cả là đã đọc', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showToast('Không thể đánh dấu tất cả là đã đọc', 'error');
    }
  };

  return (
    <div className="dropdown">
      <button
        type="button"
        className="btn position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount}
          </span>
        )}
      </button>

      <div className={`dropdown-menu dropdown-menu-end p-0 ${showDropdown ? 'show' : ''}`}>
        <div className="card border-0" style={{ width: '300px' }}>
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Thông báo</h6>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none"
                onClick={handleMarkAllAsRead}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
          <div className="card-body p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              <div className="list-group list-group-flush">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`list-group-item list-group-item-action ${
                      !notification.read ? 'bg-light' : ''
                    }`}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </small>
                      {!notification.read && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <p className="mb-1">{notification.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-3 mb-0">Không có thông báo mới</p>
            )}
          </div>
          <div className="card-footer text-center">
            <Link
              to="/notifications"
              className="btn btn-link text-decoration-none"
              onClick={() => setShowDropdown(false)}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 