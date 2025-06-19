import { API } from './api';

const NOTIFICATION_ENDPOINT = '/api/notifications';

const notificationService = {
  // Lấy tất cả thông báo của user
  getAllNotifications: () => {
    return API.get(`${NOTIFICATION_ENDPOINT}`);
  },

  // Đánh dấu thông báo đã đọc
  markAsRead: (notificationId) => {
    return API.put(`${NOTIFICATION_ENDPOINT}/${notificationId}/read`);
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: () => {
    return API.put(`${NOTIFICATION_ENDPOINT}/read-all`);
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: () => {
    return API.get(`${NOTIFICATION_ENDPOINT}/unread-count`);
  },

  // Xóa một thông báo
  deleteNotification: (notificationId) => {
    return API.delete(`${NOTIFICATION_ENDPOINT}/${notificationId}`);
  },

  // Xóa tất cả thông báo
  deleteAllNotifications: () => {
    return API.delete(`${NOTIFICATION_ENDPOINT}/all`);
  }
};

export default notificationService; 