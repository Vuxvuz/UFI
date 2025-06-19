package com.ufit.server.service;

import com.ufit.server.dto.response.NotificationDto;
import com.ufit.server.entity.Notification.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    
    // Tạo notification
    void createNotification(Long userId, String title, String message, NotificationType type);
    void createNotification(Long userId, String title, String message, NotificationType type, 
                          Long relatedEntityId, String relatedEntityType);
    
    // Lấy notifications của user
    Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable);
    List<NotificationDto> getUnreadNotifications(Long userId);
    
    // Đếm notifications chưa đọc
    long getUnreadCount(Long userId);
    
    // Đánh dấu đã đọc
    void markAsRead(Long notificationId);
    void markAllAsRead(Long userId);
    
    // Xóa notifications cũ
    void cleanupOldNotifications();
    
    // Notification cho các sự kiện cụ thể
    void notifyPostReply(Long postAuthorId, Long postId, String replierName);
    void notifyPostReported(Long postAuthorId, Long postId);
    void notifyPostDeleted(Long postAuthorId, Long postId);
    void notifyArticleReported(Long articleAuthorId, Long articleId);
    void notifyArticleDeactivated(Long articleAuthorId, Long articleId);
    void notifyTopicLocked(Long topicAuthorId, Long topicId);
    void notifyTopicUnlocked(Long topicAuthorId, Long topicId);
} 