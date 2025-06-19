// server/src/main/java/com/ufit/server/service/impl/ReportServiceImpl.java

package com.ufit.server.service.impl;

import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.entity.Article;
import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.Report;
import com.ufit.server.entity.Report.ReportStatus;
import com.ufit.server.entity.User;
import com.ufit.server.exception.ResourceNotFoundException;
import com.ufit.server.repository.ArticleRepository;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.repository.ReportRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.NotificationService;
import com.ufit.server.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final ForumPostRepository forumPostRepository;
    private final ArticleRepository articleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ReportServiceImpl(ReportRepository reportRepository,
                             ForumPostRepository forumPostRepository,
                             ArticleRepository articleRepository,
                             UserRepository userRepository,
                             NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.forumPostRepository = forumPostRepository;
        this.articleRepository = articleRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public void reportPost(Long postId, String reason, String reporterUsername) {
        User reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Report report = new Report();
        report.setReportedBy(reporter);
        report.setPost(post);
        report.setReason(reason);
        report.setCreatedAt(LocalDateTime.now());
        report.setStatus(ReportStatus.PENDING);
        reportRepository.save(report);

        // Gửi notification cho author của post
        User postAuthor = userRepository.findByUsername(post.getAuthor())
                .orElse(null);
        if (postAuthor != null && !postAuthor.getUsername().equals(reporterUsername)) {
            notificationService.notifyPostReported(postAuthor.getId(), postId);
        }
    }

    @Override
    public void reportArticle(Long articleId, String reason, String reporterUsername) {
        User reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new IllegalArgumentException("Article not found"));

        Report report = new Report();
        report.setReportedBy(reporter);
        report.setArticle(article);
        report.setReason(reason);
        report.setCreatedAt(LocalDateTime.now());
        report.setStatus(ReportStatus.PENDING);
        reportRepository.save(report);
    }

    @Override
    public Page<ReportDto> getReportsForMod(ReportStatus status, Pageable pageable) {
        Page<Report> reports = status != null 
            ? reportRepository.findByStatus(status, pageable)
            : reportRepository.findAll(pageable);
        return reports.map(ReportDto::new);
    }

    @Override
    public Page<ReportDto> getReportsForAdmin(ReportStatus status, Pageable pageable) {
        return getReportsForMod(status, pageable); // Same implementation for now
    }

    @Override
    public List<ReportDto> getPendingReportsForMod() {
        return reportRepository.findByStatus(ReportStatus.PENDING)
                .stream()
                .map(ReportDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public List<ReportDto> getPendingReportsForAdmin() {
        return getPendingReportsForMod(); // Same implementation for now
    }

    @Override
    public void reviewReportAsMod(Long reportId, String action) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        if ("DELETE_POST".equalsIgnoreCase(action)) {
            if (report.getPost() != null) {
                ForumPost post = report.getPost();
                forumPostRepository.delete(post);
            } else if (report.getArticle() != null) {
                Article article = report.getArticle();
                article.setIsActive(false); // Deactivate article instead of deleting
                articleRepository.save(article);
            }
            report.setStatus(ReportStatus.REVIEWED);
        } else if ("IGNORE".equalsIgnoreCase(action)) {
            report.setStatus(ReportStatus.IGNORED);
        }
        reportRepository.save(report);
    }

    @Override
    public void reviewReportAsAdmin(Long reportId, String action) {
        reviewReportAsMod(reportId, action); // Same implementation for now
    }
}
