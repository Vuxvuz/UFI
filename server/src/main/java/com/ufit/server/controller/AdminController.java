package com.ufit.server.controller;

import com.ufit.server.dto.response.AdminDashboard;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.ArticleDto;
import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.dto.response.SystemInfoDto;
import com.ufit.server.dto.response.UserDto;
import com.ufit.server.service.AdminService;
import com.ufit.server.service.ArticleService;
import com.ufit.server.service.ReportService;
import com.ufit.server.service.SystemInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller dành cho ROLE_ADMIN.
 * Bao gồm dashboard, reports, assign-role, users, articles, system-info.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private ArticleService articleService;

    @Autowired
    private SystemInfoService systemInfoService;

    /**
     * 1) Admin Dashboard data (số liệu thống kê)
     *    GET /api/admin/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboard> dashboard() {
        AdminDashboard dto = adminService.getDashboard();
        return ResponseEntity.ok(dto);
    }

    /**
     * 2) Lấy danh sách Report đang pending cho admin (màn “Reports”)
     *    GET /api/admin/reports
     */
    @GetMapping("/reports")
    public ResponseEntity<List<ReportDto>> getPendingReportsForAdmin() {
        List<ReportDto> reports = reportService.getPendingReportsForAdmin();
        return ResponseEntity.ok(reports);
    }

    /**
     * 3) Admin review một report (DELETE_POST hoặc IGNORE)
     *    PUT /api/admin/reports/{reportId}/review?action=DELETE_POST
     */
    @PutMapping("/reports/{reportId}/review")
    public ResponseEntity<ApiResponse<String>> reviewReport(
            @PathVariable Long reportId,
            @RequestParam("action") String action) {

        reportService.reviewReportAsAdmin(reportId, action);
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Report reviewed successfully", null));
    }

    /**
     * 4) Gán role cho user (ví dụ: ROLE_MODERATOR)
     *    POST /api/admin/assign-role?username=…&role=…
     */
    @PostMapping("/assign-role")
    public ResponseEntity<ApiResponse<String>> assignRole(
            @RequestParam String username,
            @RequestParam String role) {

        adminService.assignRole(username, role);
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Role assigned successfully", null));
    }

    /**
     * 5) Lấy tất cả Article (dưới dạng DTO) để hiển thị bên Admin Dashboard / Manage Articles
     *    GET /api/admin/articles
     */
    @GetMapping("/articles")
    public ResponseEntity<List<ArticleDto>> getAllArticles() {
        List<ArticleDto> articles = articleService.getLatestArticles(Integer.MAX_VALUE);
        // Giải thích: Ở đây, ta tận dụng phương thức getLatestArticles để lấy tất cả
        //    nếu ta không có sẵn method getAllArticlesDTO() riêng. 
        //    Nếu muốn rõ ràng hơn, bạn có thể bổ sung một method getAllArticlesDTO() trong ArticleService,
        //    trừ trường hợp đã có sẵn.
        return ResponseEntity.ok(articles);
    }

    /**
     * 6) Lấy thông tin System (số user, số article, uptime, version…)
     *    GET /api/admin/system-info
     */
    @GetMapping("/system-info")
    public ResponseEntity<SystemInfoDto> getSystemInfo() {
        SystemInfoDto systemInfo = systemInfoService.fetchSystemInfo();
        return ResponseEntity.ok(systemInfo);
    }

    /**
     * 7) Lấy danh sách toàn bộ User (Admin only)
     *    GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}
