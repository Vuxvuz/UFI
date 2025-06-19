package com.ufit.server.controller;

import com.ufit.server.dto.response.AdminDashboard;
import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.ArticleDto;
import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.dto.response.SystemInfoDto;
import com.ufit.server.dto.response.UserDto;
import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.service.AdminService;
import com.ufit.server.service.ArticleService;
import com.ufit.server.service.ReportService;
import com.ufit.server.service.SystemInfoService;
import com.ufit.server.service.ChatSupportService;
import com.ufit.server.entity.ChatSupport;
import com.ufit.server.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.security.Principal;

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

    @Autowired
    private ChatSupportService chatSupportService;

    @Autowired
    private UserRepository userRepository;

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
     * 2) Lấy danh sách Report đang pending cho admin (màn "Reports")
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

     @DeleteMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long userId) {
        try {
            adminService.deleteUserById(userId); // Phải implement trong AdminServiceImpl
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "User deleted", null));
        } catch (Exception ex) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("ERROR", "Cannot delete user: " + ex.getMessage(), null));
        }
    }
        
    
    @DeleteMapping("/article/{articleId}")
    public ResponseEntity<ApiResponse<String>> deleteArticle(@PathVariable Long articleId) {
        try {
            articleService.deleteArticleById(articleId); // implement trong ArticleServiceImpl
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Article deleted", null));
        } catch (Exception ex) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("ERROR", "Cannot delete article: " + ex.getMessage(), null));
        }
    }

    /**
     * Get all chat support conversations for admin dashboard
     */
    @GetMapping("/chat-support")
    public ResponseEntity<ApiResponse<List<ChatSupportDto>>> getAllChatSessions() {
        try {
            List<ChatSupportDto> chatSessions = chatSupportService.getAllConversations();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat sessions retrieved successfully", chatSessions));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Admin initiates a chat with a specific user
     */
    @PostMapping("/chat-support/initiate")
    public ResponseEntity<ApiResponse<ChatSupportDto>> initiateChat(
        @RequestParam Long userId,
        @RequestParam String message,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long adminId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
            
            ChatSupport chat = chatSupportService.initiateAdminChat(userId, adminId, message);
            ChatSupportDto dto = chatSupportService.mapToDto(chat);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat initiated successfully", dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Cập nhật trạng thái active của user
     * POST /api/admin/users/{userId}/status
     */
    @PostMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> statusUpdate) {
        try {
            boolean active = statusUpdate.get("active");
            adminService.updateUserStatus(userId, active);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "User status updated successfully", null));
        } catch (Exception ex) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("ERROR", "Cannot update user status: " + ex.getMessage(), null));
        }
    }

}
