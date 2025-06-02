package com.ufit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticleDto {
    private Long id;
    private String href;
    private String title;
    private String content;
    private String category;
    private String author;
    private String imageUrl;
    private String source;
    private String description;
    private String tags;
    private Boolean isActive;
    private String language;
    private Integer wordCount;
    private Integer readingTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor cho basic fields (backward compatibility)
    public ArticleDto(Long id, String title, String content, String category, 
                     String author, LocalDateTime createdAt, String imageUrl) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.category = category;
        this.author = author;
        this.createdAt = createdAt;
        this.imageUrl = imageUrl;
        this.isActive = true;
        this.source = "unknown";
        this.language = "en";
    }
    
    // Constructor cho summary view
    public ArticleDto(Long id, String title, String description, String category, 
                     String imageUrl, String source, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.imageUrl = imageUrl;
        this.source = source;
        this.createdAt = createdAt;
        this.isActive = true;
        this.language = "en";
    }
    
    // Helper method để tạo summary version (không có full content)
    public ArticleDto toSummary() {
        return new ArticleDto(id, title, description, category, imageUrl, source, createdAt);
    }
} 