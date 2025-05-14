// src/main/java/com/ufit/server/controller/AdminController.java
package com.ufit.server.controller;

import com.ufit.server.dto.response.AdminDashboard;
import com.ufit.server.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    @Autowired private AdminService adminService;

    @GetMapping("/dashboard")
    public AdminDashboard dashboard() {
        return adminService.getDashboard();
    }

    @PostMapping("/assign-role")
    public void assignRole(@RequestParam String username,
                           @RequestParam String role) {
        adminService.assignRole(username, role);
    }
}
