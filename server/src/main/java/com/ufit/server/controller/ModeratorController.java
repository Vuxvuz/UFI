package com.ufit.server.controller;

import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.dto.response.TopicDto;
import com.ufit.server.dto.response.ModeratorDashboard;
import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.service.ChatSupportService;
import com.ufit.server.service.ModeratorService;
import com.ufit.server.service.ReportService;
import com.ufit.server.service.TopicService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Tất cả endpoint trong controller này đều bắt đầu bằng "/api/mod"
 * và chỉ cho phép ROLE_MODERATOR truy cập.
 */
@RestController
@RequestMapping("/api/mod")
@PreAuthorize("hasAuthority('ROLE_MODERATOR')")
public class ModeratorController {

    @Autowired
    private ModeratorService moderatorService;

    @Autowired
    private TopicService topicService;

    @Autowired
    private ChatSupportService chatSupportService;

    @Autowired
    private ReportService reportService;

    /**
     * 1) Moderator Dashboard data (số liệu thống kê)
     * GET /api/mod/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ModeratorDashboard> dashboard() {
        ModeratorDashboard dto = moderatorService.getDashboard();
        return ResponseEntity.ok(dto);
    }

    /**
     * 2) Lấy danh sách Topic cho màn “Topics” trong dashboard
     * GET /api/mod/topics
     */
    @GetMapping("/topics")
    public ResponseEntity<List<TopicDto>> getAllTopicsForMod() {
        List<TopicDto> dtos = topicService.getAllTopicsForModerator()
                .stream()
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * 3) Lấy toàn bộ cuộc hội thoại Chat Support cho màn “Chat Support”
     * GET /api/mod/chat
     */
    @GetMapping("/chat")
    public ResponseEntity<List<ChatSupportDto>> getAllChatSupportForMod() {
        List<ChatSupportDto> dtos = chatSupportService.getAllConversations()
                .stream()
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * 4) Pending Reports cho moderator (màn “Reports”)
     * GET /api/mod/reports
     */
    @GetMapping("/reports")
    public ResponseEntity<List<ReportDto>> getPendingReportsForMod() {
        List<ReportDto> reports = reportService.getPendingReportsForMod();
        return ResponseEntity.ok(reports);
    }

    /**
     * 5) Moderator review một report (DELETE_POST hoặc IGNORE)
     * PUT /api/mod/reports/{reportId}/review?action=DELETE_POST
     */
    @PutMapping("/reports/{reportId}/review")
    public ResponseEntity<String> reviewReport(
            @PathVariable Long reportId,
            @RequestParam("action") String action) {

        reportService.reviewReportAsMod(reportId, action);
        return ResponseEntity.ok("SUCCESS: Report reviewed successfully");
    }
}
