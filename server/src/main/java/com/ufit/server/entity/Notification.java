package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status = NotificationStatus.UNREAD;

    // Reference to related entity (optional)
    private Long relatedEntityId;
    private String relatedEntityType; // "POST", "ARTICLE", "TOPIC", etc.

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime readAt;

    public enum NotificationType {
        POST_REPLY,           // Có người reply post của bạn
        POST_REPORTED,        // Post của bạn bị report
        POST_DELETED,         // Post của bạn bị xóa
        ARTICLE_REPORTED,     // Article của bạn bị report
        ARTICLE_DEACTIVATED,  // Article của bạn bị deactivate
        TOPIC_LOCKED,         // Topic của bạn bị khóa
        TOPIC_UNLOCKED,       // Topic của bạn được mở khóa
        SYSTEM_MESSAGE,       // Thông báo hệ thống
        MODERATOR_ACTION      // Hành động từ moderator
    }

    public enum NotificationStatus {
        UNREAD,     // Chưa đọc
        READ,       // Đã đọc
        ARCHIVED    // Đã lưu trữ
    }

    public Notification() {}

    public Notification(User user, String title, String message, NotificationType type) {
        this.user = user;
        this.title = title;
        this.message = message;
        this.type = type;
    }

    public Notification(User user, String title, String message, NotificationType type, 
                       Long relatedEntityId, String relatedEntityType) {
        this.user = user;
        this.title = title;
        this.message = message;
        this.type = type;
        this.relatedEntityId = relatedEntityId;
        this.relatedEntityType = relatedEntityType;
    }

    // Getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }
    
    public NotificationStatus getStatus() { return status; }
    public void setStatus(NotificationStatus status) { this.status = status; }
    
    public Long getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Long relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    
    public String getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
} 