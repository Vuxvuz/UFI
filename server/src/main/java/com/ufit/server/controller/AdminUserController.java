package com.ufit.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.service.AdminService;


@RestController
@RequestMapping("/api/admin/user")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminUserController {
    private final AdminService adminService;
    public AdminUserController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/{username}")
    public UserProfile getAnyUser(@PathVariable String username) {
        return adminService.getUserProfile(username);
    }

    @PostMapping("/{username}/role")
    public ResponseEntity<Void> assignRole(
        @PathVariable String username,
        @RequestParam("role") String role
    ) {
        adminService.assignRole(username, role);
        return ResponseEntity.ok().build();
    }
}
