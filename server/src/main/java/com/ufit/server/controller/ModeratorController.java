package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.ChatSupportDto;
import com.ufit.server.dto.response.TopicDto;
import com.ufit.server.dto.response.ModeratorDashboard;
import com.ufit.server.dto.response.ReportDto;
import com.ufit.server.entity.Category;
import com.ufit.server.entity.ChatSupport;
import com.ufit.server.entity.Report;
import com.ufit.server.entity.Report.ReportStatus;
import com.ufit.server.entity.Report.ModReportType;
import com.ufit.server.entity.User;
import com.ufit.server.repository.UserRepository;
import com.ufit.server.repository.ReportRepository;
import com.ufit.server.service.CategoryService;
import com.ufit.server.service.ChatSupportService;
import com.ufit.server.service.ModeratorService;
import com.ufit.server.service.ReportService;
import com.ufit.server.service.TopicService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.security.Principal;
import java.time.LocalDateTime;
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

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ReportRepository reportRepository;

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
     * 2) Lấy danh sách Topic cho màn "Topics" trong dashboard
     * GET /api/mod/topics
     */
    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<List<TopicDto>>> getAllTopicsForMod() {
        try {
            List<TopicDto> dtos = topicService.getAllTopicsForModerator()
                    .stream()
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Topics retrieved successfully", dtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * Lấy danh sách Category cho màn "Categories" trong dashboard
     * GET /api/mod/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Category>>> getAllCategories() {
        try {
            List<Category> categories = categoryService.getAllCategories();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Categories retrieved successfully", categories));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * 3) Lấy toàn bộ cuộc hội thoại Chat Support cho màn "Chat Support"
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
     * 4) Pending Reports cho moderator (màn "Reports")
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

    /**
     * Get pending chat support sessions for moderator
     */
    @GetMapping("/chat-support/pending")
    public ResponseEntity<ApiResponse<List<ChatSupportDto>>> getPendingChats() {
        try {
            List<ChatSupportDto> pendingChats = chatSupportService.getPendingChatSessions();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Pending chats retrieved successfully", pendingChats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Get active chat support sessions assigned to this moderator
     */
    @GetMapping("/chat-support/active")
    public ResponseEntity<ApiResponse<List<ChatSupportDto>>> getModeratorChats(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long moderatorId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
                
            List<ChatSupportDto> modChats = chatSupportService.getModeratorChatSessions(moderatorId);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Moderator chats retrieved successfully", modChats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Accept a pending chat support session
     */
    @PostMapping("/chat-support/accept/{chatId}")
    public ResponseEntity<ApiResponse<ChatSupportDto>> acceptChat(
        @PathVariable Long chatId,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            Long moderatorId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
                
            ChatSupport chat = chatSupportService.assignModerator(chatId, moderatorId);
            ChatSupportDto dto = chatSupportService.mapToDto(chat);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat accepted successfully", dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Close a chat support session
     */
    @PostMapping("/chat-support/close/{chatId}")
    public ResponseEntity<ApiResponse<String>> closeChat(@PathVariable Long chatId) {
        try {
            chatSupportService.closeChat(chatId);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Chat closed successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Thêm một Category mới
     * POST /api/mod/categories
     */
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Category>> addCategory(@RequestParam String name) {
        try {
            Category category = categoryService.addCategory(name);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Category added successfully", category));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * Cập nhật một Category
     * PUT /api/mod/categories
     */
    @PutMapping("/categories")
    public ResponseEntity<ApiResponse<String>> updateCategory(
            @RequestParam String oldName,
            @RequestParam String newName) {
        try {
            categoryService.updateCategoryName(oldName, newName);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Category updated successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
    
    /**
     * Xóa một Category
     * DELETE /api/mod/categories
     */
    @DeleteMapping("/categories")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@RequestParam String name) {
        try {
            categoryService.deleteCategory(name);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Category deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Thêm endpoint mới để lấy reports với phân trang và filter
     * GET /api/mod/reports/all
     */
    @GetMapping("/reports/all")
    public ResponseEntity<ApiResponse<Page<ReportDto>>> getAllReports(
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt,desc") String[] sort
    ) {
        try {
            ReportStatus reportStatus = status != null ? ReportStatus.valueOf(status.toUpperCase()) : null;
            
            // Create Pageable object with sorting
            String sortField = sort[0];
            String sortDirection = sort.length > 1 ? sort[1] : "desc";
            Sort.Direction direction = Sort.Direction.fromString(sortDirection);
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));
            
            // Get paginated reports
            Page<ReportDto> reports = reportService.getReportsForMod(reportStatus, pageable);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Reports retrieved successfully", reports));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>("ERROR", "Invalid status value: " + status, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Endpoint cho moderator tạo report cho admin
     * POST /api/mod/reports/create
     */
    @PostMapping("/reports/create")
    public ResponseEntity<ApiResponse<ReportDto>> createModReport(
        @RequestParam(required = false) Long userId,
        @RequestParam String reason,
        @RequestParam ModReportType type,
        Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }
        
        try {
            User moderator = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("Moderator not found"));
                
            User reportedUser = null;
            if (userId != null) {
                reportedUser = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Reported user not found"));
            }
            
            Report report = new Report();
            report.setReportedBy(moderator);
            report.setReportedUser(reportedUser);
            report.setReason(reason);
            report.setStatus(ReportStatus.PENDING);
            report.setModReportType(type);
            report.setCreatedAt(LocalDateTime.now());
            
            Report savedReport = reportRepository.save(report);
            ReportDto dto = new ReportDto(savedReport);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Report created successfully", dto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
}
