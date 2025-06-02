// server/src/main/java/com/ufit/server/dto/ReportDto.java

package com.ufit.server.dto.response;

import com.ufit.server.entity.Report;
import java.time.LocalDateTime;

public class ReportDto {
    private Long id;
    private Long postId;
    private String postSnippet;
    private String postAuthorUsername;
    private String reportedByUsername;
    private String reason;
    private LocalDateTime createdAt;
    private String status;

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
    }

    public ReportDto(Report report) {
        this.id = report.getId();
        this.postId = report.getPost().getId();

        String content = report.getPost().getContent();
        this.postSnippet = (content.length() > 50) ? content.substring(0, 50) + "..." : content;

        // ForumPost.author là String
        this.postAuthorUsername = report.getPost().getAuthor();

        // Report.reportedBy là User, gọi getUsername()
        this.reportedByUsername = report.getReportedBy().getUsername();

        this.reason = report.getReason();
        this.createdAt = report.getCreatedAt();
        this.status = report.getStatus().name();
    }

    // Getters
    public Long getId() {
        return id;
    }
    public Long getPostId() {
        return postId;
    }
    public String getPostSnippet() {
        return postSnippet;
    }
    public String getPostAuthorUsername() {
        return postAuthorUsername;
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

    public void setStatus(String status) {
        this.status = status;
    }
}
