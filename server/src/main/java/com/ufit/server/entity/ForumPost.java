// server/src/main/java/com/ufit/server/entity/ForumPost.java
package com.ufit.server.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_posts")
public class ForumPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "topic_id")
    private ForumTopic topic;

    private String author;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column
    private String imageUrl;

    private LocalDateTime createdAt = LocalDateTime.now();

    // getters & setters

    public Long getId() { return id; }
    public ForumTopic getTopic() { return topic; }
    public void setTopic(ForumTopic topic) { this.topic = topic; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
