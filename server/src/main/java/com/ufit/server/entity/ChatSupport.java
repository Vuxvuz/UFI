package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity cho một bản ghi ChatSupport (ví dụ: message hỗ trợ).
 * Chỉ gồm id và message. Sau này có thể thêm thông tin về user, timestamp, v.v.
 */
@Entity
@Table(name = "chat_support")
@Data
public class ChatSupport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String message;

    // Constructor mặc định của JPA
    public ChatSupport() {}

    // Constructor tiện lợi
    public ChatSupport(String message) {
        this.message = message;
    }
}
