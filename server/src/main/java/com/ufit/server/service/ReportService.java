package com.ufit.server.service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.entity.Report.ReportStatus;

public interface ReportService {
    void reportPost(Long postId, String reason, String reporterUsername);
    void reportArticle(Long articleId, String reason, String reporterUsername);
    
    // Get paginated reports with optional status filter
    Page<ReportDto> getReportsForMod(ReportStatus status, Pageable pageable);
    Page<ReportDto> getReportsForAdmin(ReportStatus status, Pageable pageable);
    
    // Get pending reports (for backward compatibility)
    List<ReportDto> getPendingReportsForMod();
    List<ReportDto> getPendingReportsForAdmin();
    
    void reviewReportAsMod(Long reportId, String action);
    void reviewReportAsAdmin(Long reportId, String action);
}