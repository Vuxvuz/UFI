package com.ufit.server.entity;
// server/src/main/java/com/ufit/server/entity/ChatMetric.java
// muc dich la luu lai/capnhap cac thong tin ve chatbot
// tranh can thiepp them code vao controller

import java.time.LocalDateTime; 
import jakarta.persistence.*;

@Entity
@Table(name = "chat_metrics")
public class ChatMetric {
    @Id
    private String username;          // dùng username làm khoá
    private long messageCount;
    private LocalDateTime lastSentAt;

    // getters / setters / constructors
    public ChatMetric() {}
    public ChatMetric(String username) {
        this.username = username;
        this.messageCount = 0;
        this.lastSentAt = null;
    }
    // ... (getters & setters)

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public long getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(long messageCount) {
        this.messageCount = messageCount;
    }

    public LocalDateTime getLastSentAt() {
        return lastSentAt;
    }

    public void setLastSentAt(LocalDateTime lastSentAt) {
        this.lastSentAt = lastSentAt;
    }
    
}