// server/src/main/java/com/ufit/server/service/impl/ReportServiceImpl.java

package com.ufit.server.service.impl;

import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.entity.ForumPost;
import com.ufit.server.entity.Report;
import com.ufit.server.entity.ReportStatus;
import com.ufit.server.entity.User;
import com.ufit.server.exception.ResourceNotFoundException;
import com.ufit.server.repository.ForumPostRepository;
import com.ufit.server.repository.ReportRepository;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.service.ReportService;

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
    private final UserRepository userRepository;

    public ReportServiceImpl(ReportRepository reportRepository,
                             ForumPostRepository forumPostRepository,
                             UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.forumPostRepository = forumPostRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void reportPost(Long postId, String reason, String reporterUsername) {
        User reporter = userRepository.findByUsername(reporterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", reporterUsername));
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumPost", "id", postId));

        Report report = new Report();
        report.setReportedBy(reporter);
        report.setPost(post);
        report.setReason(reason);
        report.setCreatedAt(LocalDateTime.now());
        report.setStatus(ReportStatus.PENDING);
        reportRepository.save(report);
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
        return reportRepository.findByStatus(ReportStatus.PENDING)
                .stream()
                .map(ReportDto::new)
                .collect(Collectors.toList());
    }

    @Override
    public void reviewReportAsMod(Long reportId, String action) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        if ("DELETE_POST".equalsIgnoreCase(action)) {
            ForumPost post = report.getPost();
            forumPostRepository.delete(post);
            report.setStatus(ReportStatus.REVIEWED);
        } else if ("IGNORE".equalsIgnoreCase(action)) {
            report.setStatus(ReportStatus.IGNORED);
        }
        reportRepository.save(report);
    }

    @Override
    public void reviewReportAsAdmin(Long reportId, String action) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));

        if ("DELETE_POST".equalsIgnoreCase(action)) {
            ForumPost post = report.getPost();
            forumPostRepository.delete(post);
            report.setStatus(ReportStatus.REVIEWED);
        } else if ("IGNORE".equalsIgnoreCase(action)) {
            report.setStatus(ReportStatus.IGNORED);
        }
        reportRepository.save(report);
    }
}
