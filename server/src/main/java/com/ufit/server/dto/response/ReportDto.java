// server/src/main/java/com/ufit/server/dto/ReportDto.java

package com.ufit.server.dto.response;

import com.ufit.server.entity.Report;
import java.time.LocalDateTime;

public class ReportDto {
    private Long id;
    private Long postId;
    private Long articleId;
    private String postSnippet;
    private String articleTitle;
    private String postAuthorUsername;
    private String articleAuthor;
    private String reportedByUsername;
    private String reason;
    private LocalDateTime createdAt;
    private String status;
    private String reportType; // "POST", "ARTICLE", "USER"

    public ReportDto() { }

    public ReportDto(Long id, Long postId, String postSnippet, String postAuthorUsername,
                     String reportedByUsername, String reason, LocalDateTime createdAt, String status) {
        this.id = id;
        this.postId = postId;
        this.postSnippet = postSnippet;
        this.postAuthorUsername = postAuthorUsername;
        this.reportedByUsername = reportedByUsername;
        this.reason = reason;
        this.createdAt = createdAt;
        this.status = status;
        this.reportType = "POST";
    }

    public ReportDto(Report report) {
        this.id = report.getId();
        this.reportedByUsername = report.getReportedBy().getUsername();
        this.reason = report.getReason();
        this.createdAt = report.getCreatedAt();
        this.status = report.getStatus().name();

        if (report.getPost() != null) {
            // Post report
            this.postId = report.getPost().getId();
            String content = report.getPost().getContent();
            this.postSnippet = (content.length() > 50) ? content.substring(0, 50) + "..." : content;
            this.postAuthorUsername = report.getPost().getAuthor();
            this.reportType = "POST";
        } else if (report.getArticle() != null) {
            // Article report
            this.articleId = report.getArticle().getId();
            this.articleTitle = report.getArticle().getTitle();
            this.articleAuthor = report.getArticle().getAuthor();
            this.reportType = "ARTICLE";
        } else if (report.getReportedUser() != null) {
            // User report
            this.reportType = "USER";
        }
    }

    // Getters
    public Long getId() {
        return id;
    }
    public Long getPostId() {
        return postId;
    }
    public Long getArticleId() {
        return articleId;
    }
    public String getPostSnippet() {
        return postSnippet;
    }
    public String getArticleTitle() {
        return articleTitle;
    }
    public String getPostAuthorUsername() {
        return postAuthorUsername;
    }
    public String getArticleAuthor() {
        return articleAuthor;
    }
    public String getReportedByUsername() {
        return reportedByUsername;
    }
    public String getReason() {
        return reason;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public String getStatus() {
        return status;
    }
    public String getReportType() {
        return reportType;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }
    public void setPostId(Long postId) {
        this.postId = postId;
    }
    public void setArticleId(Long articleId) {
        this.articleId = articleId;
    }
    public void setPostSnippet(String postSnippet) {
        this.postSnippet = postSnippet;
    }
    public void setArticleTitle(String articleTitle) {
        this.articleTitle = articleTitle;
    }
    public void setPostAuthorUsername(String postAuthorUsername) {
        this.postAuthorUsername = postAuthorUsername;
    }
    public void setArticleAuthor(String articleAuthor) {
        this.articleAuthor = articleAuthor;
    }
    public void setReportedByUsername(String reportedByUsername) {
        this.reportedByUsername = reportedByUsername;
    }
    public void setReason(String reason) {
        this.reason = reason;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public void setReportType(String reportType) {
        this.reportType = reportType;
    }
}
