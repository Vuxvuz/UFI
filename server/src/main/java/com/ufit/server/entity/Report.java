package com.ufit.server.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Người report
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    // Post bị report
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private ForumPost post;

    @Column(length = 500)
    private String reason;

    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    public Report() { }

    public Report(User reportedBy, ForumPost post, String reason, LocalDateTime createdAt, ReportStatus status) {
        this.reportedBy = reportedBy;
        this.post = post;
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
