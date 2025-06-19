package com.ufit.server.service.impl;

import com.ufit.server.dto.response.NotificationDto;
import com.ufit.server.entity.Notification;
import com.ufit.server.entity.Notification.NotificationStatus;
import com.ufit.server.entity.Notification.NotificationType;
import com.ufit.server.entity.User;
import com.ufit.server.repository.NotificationRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void createNotification(Long userId, String title, String message, NotificationType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Notification notification = new Notification(user, title, message, type);
        notificationRepository.save(notification);
    }

    @Override
    public void createNotification(Long userId, String title, String message, NotificationType type, 
                                 Long relatedEntityId, String relatedEntityType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Notification notification = new Notification(user, title, message, type, relatedEntityId, relatedEntityType);
        notificationRepository.save(notification);
    }

    @Override
    public Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(NotificationDto::new);
    }

    @Override
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.UNREAD);
        return notifications.stream().map(NotificationDto::new).collect(Collectors.toList());
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    @Override
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId, NotificationStatus.READ);
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, NotificationStatus.READ);
    }

    @Override
    public void cleanupOldNotifications() {
        // Xóa notifications cũ hơn 30 ngày
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        notificationRepository.deleteOldNotifications(cutoffDate);
    }

    // Notification cho các sự kiện cụ thể
    @Override
    public void notifyPostReply(Long postAuthorId, Long postId, String replierName) {
        String title = "New Reply";
        String message = replierName + " replied to your post";
        createNotification(postAuthorId, title, message, NotificationType.POST_REPLY, postId, "POST");
    }

    @Override
    public void notifyPostReported(Long postAuthorId, Long postId) {
        String title = "Post Reported";
        String message = "Your post has been reported and is under review";
        createNotification(postAuthorId, title, message, NotificationType.POST_REPORTED, postId, "POST");
    }

    @Override
    public void notifyPostDeleted(Long postAuthorId, Long postId) {
        String title = "Post Deleted";
        String message = "Your post has been deleted by a moderator";
        createNotification(postAuthorId, title, message, NotificationType.POST_DELETED, postId, "POST");
    }

    @Override
    public void notifyArticleReported(Long articleAuthorId, Long articleId) {
        String title = "Article Reported";
        String message = "Your article has been reported and is under review";
        createNotification(articleAuthorId, title, message, NotificationType.ARTICLE_REPORTED, articleId, "ARTICLE");
    }

    @Override
    public void notifyArticleDeactivated(Long articleAuthorId, Long articleId) {
        String title = "Article Deactivated";
        String message = "Your article has been deactivated by a moderator";
        createNotification(articleAuthorId, title, message, NotificationType.ARTICLE_DEACTIVATED, articleId, "ARTICLE");
    }

    @Override
    public void notifyTopicLocked(Long topicAuthorId, Long topicId) {
        String title = "Topic Locked";
        String message = "Your topic has been locked by a moderator";
        createNotification(topicAuthorId, title, message, NotificationType.TOPIC_LOCKED, topicId, "TOPIC");
    }

    @Override
    public void notifyTopicUnlocked(Long topicAuthorId, Long topicId) {
        String title = "Topic Unlocked";
        String message = "Your topic has been unlocked by a moderator";
        createNotification(topicAuthorId, title, message, NotificationType.TOPIC_UNLOCKED, topicId, "TOPIC");
    }
} 