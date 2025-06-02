package com.ufit.server.service;

import java.util.List;

import com.ufit.server.dto.response.ReportDto;
public interface ReportService {
    void reportPost(Long postId, String reason, String reporterUsername);
    List<ReportDto> getPendingReportsForMod();
    List<ReportDto> getPendingReportsForAdmin();
    void reviewReportAsMod(Long reportId, String action);
    void reviewReportAsAdmin(Long reportId, String action);
}