package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entity cho một Topic trong forum.
 * Hiện tại chúng ta chỉ để id và title. Sau này có thể thêm nhiều trường hơn (author, content, v.v.).
 */
@Entity
@Table(name = "topics")
@Data
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    // Constructor mặc định của JPA
    public Topic() {}

    // Constructor tiện lợi (nếu cần khởi tạo nhanh)
    public Topic(String title) {
        this.title = title;
    }
}
