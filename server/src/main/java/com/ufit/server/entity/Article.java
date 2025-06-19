package com.ufit.server.entity;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.security.MessageDigest;
import javax.xml.bind.DatatypeConverter;

@Entity
@Data
@Table(name = "articles")
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 500)
    private String href;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "LONGTEXT")
    private String content;
    
    @Column(nullable = false, length = 100)
    private String category;
    
    @Column(length = 200)
    private String author;
    
    @Column(length = 500)
    private String imageUrl;
    
    // Track source of article (which JSON file or website)
    @Column(nullable = false, length = 100)
    private String source = "unknown";
    
    // For deduplication
    @Column(length = 64)
    private String contentHash;
    
    // SEO and metadata
    @Column(length = 1000)
    private String description;
    
    @Column(length = 500)
    private String tags;
    
    // Status tracking
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private Boolean isProcessed = false;
    
    // Language support
    @Column(length = 10)
    private String language = "vi";
    
    // Content metrics
    private Integer wordCount;
    private Integer readingTime; // in minutes
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
        if (isProcessed == null) {
            isProcessed = false;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructor không tham số
    public Article() {}

    // Constructor đầy đủ
    public Article(String href, String title, String content, String category, 
                  String author, String imageUrl, String source) {
        this.href = href;
        this.title = title;
        this.content = content;
        this.category = category;
        this.author = author;
        this.imageUrl = imageUrl;
        this.source = source;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isActive = true;
        this.isProcessed = false;
        this.language = "en";
    }
    
    // Helper methods
    public void calculateMetrics() {
        if (content != null) {
            String[] words = content.split("\\s+");
            this.wordCount = words.length;
            this.readingTime = Math.max(1, wordCount / 200); // 200 words per minute
        }
    }
    
    public void generateContentHash() {
        if (title != null && content != null) {
            try {
                String combined = title + content;
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hashBytes = digest.digest(combined.getBytes("UTF-8"));
                this.contentHash = DatatypeConverter.printHexBinary(hashBytes).toLowerCase();
            } catch (Exception e) {
                this.contentHash = Integer.toHexString((title + content).hashCode());
            }
        }
    }
}
