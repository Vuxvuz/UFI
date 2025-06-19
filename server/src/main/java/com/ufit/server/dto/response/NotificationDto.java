package com.ufit.server.dto.response;

import com.ufit.server.entity.Notification;
import java.time.LocalDateTime;

public class NotificationDto {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String status;
    private Long relatedEntityId;
    private String relatedEntityType;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    public NotificationDto() {}

    public NotificationDto(Notification notification) {
        this.id = notification.getId();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.type = notification.getType().name();
        this.status = notification.getStatus().name();
        this.relatedEntityId = notification.getRelatedEntityId();
        this.relatedEntityType = notification.getRelatedEntityType();
        this.createdAt = notification.getCreatedAt();
        this.readAt = notification.getReadAt();
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getType() { return type; }
    public String getStatus() { return status; }
    public Long getRelatedEntityId() { return relatedEntityId; }
    public String getRelatedEntityType() { return relatedEntityType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getReadAt() { return readAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setType(String type) { this.type = type; }
    public void setStatus(String status) { this.status = status; }
    public void setRelatedEntityId(Long relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
} 