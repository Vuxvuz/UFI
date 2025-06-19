package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.NotificationDto;
import com.ufit.server.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.ufit.server.repository.UserRepository userRepository;

    /**
     * Lấy danh sách notifications của user với phân trang
     * GET /api/notifications?page=0&size=10
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            Long userId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Pageable pageable = PageRequest.of(page, size);
            Page<NotificationDto> notifications = notificationService.getUserNotifications(userId, pageable);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Notifications retrieved successfully", notifications));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Lấy notifications chưa đọc
     * GET /api/notifications/unread
     */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotifications(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            Long userId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            List<NotificationDto> notifications = notificationService.getUnreadNotifications(userId);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Unread notifications retrieved successfully", notifications));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Đếm số notifications chưa đọc
     * GET /api/notifications/unread-count
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            Long userId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            long count = notificationService.getUnreadCount(userId);
            
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Unread count retrieved successfully", count));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Đánh dấu một notification là đã đọc
     * PUT /api/notifications/{notificationId}/read
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<String>> markAsRead(
            @PathVariable Long notificationId,
            Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            notificationService.markAsRead(notificationId);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Notification marked as read", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    /**
     * Đánh dấu tất cả notifications là đã đọc
     * PUT /api/notifications/mark-all-read
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<String>> markAllAsRead(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401)
                .body(new ApiResponse<>("ERROR", "Unauthorized", null));
        }

        try {
            Long userId = userRepository.findByUsername(principal.getName())
                .map(user -> user.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "All notifications marked as read", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
} 