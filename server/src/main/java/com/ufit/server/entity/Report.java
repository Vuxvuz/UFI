package com.ufit.server.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người report
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    // Post bị report (có thể null nếu là mod report hoặc article report)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private ForumPost post;

    // Article bị report (có thể null nếu là mod report hoặc post report)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id")
    private Article article;

    // User bị report bởi mod (có thể null nếu là user report post/article)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    @Enumerated(EnumType.STRING)
    private ModReportType modReportType;

    private LocalDateTime createdAt;

    public enum ReportStatus {
        PENDING,    // Chưa xử lý
        REVIEWED,   // Đã xử lý (xóa post/article hoặc xử lý user)
        IGNORED     // Bỏ qua (không vi phạm)
    }

    public enum ModReportType {
        USER_VIOLATION,     // Vi phạm của user
        SYSTEM_ISSUE,      // Vấn đề hệ thống
        CONTENT_ISSUE,     // Vấn đề về nội dung
        OTHER              // Khác
    }

    public Report() { }

    public Report(User reportedBy, ForumPost post, String reason, LocalDateTime createdAt, ReportStatus status) {
        this.reportedBy = reportedBy;
        this.post = post;
        this.reason = reason;
        this.createdAt = createdAt;
        this.status = status;
    }

    // Constructor cho article report
    public Report(User reportedBy, Article article, String reason, LocalDateTime createdAt, ReportStatus status) {
        this.reportedBy = reportedBy;
        this.article = article;
        this.reason = reason;
        this.createdAt = createdAt;
        this.status = status;
    }

    // Getters & setters
    
    public Long getId() {
        return id;
    }

    public User getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(User reportedBy) {
        this.reportedBy = reportedBy;
    }

    public ForumPost getPost() {
        return post;
    }

    public void setPost(ForumPost post) {
        this.post = post;
    }

    public Article getArticle() {
        return article;
    }

    public void setArticle(Article article) {
        this.article = article;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }
}
