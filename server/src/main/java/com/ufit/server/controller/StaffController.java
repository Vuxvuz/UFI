// src/main/java/com/ufit/server/controller/StaffController.java
package com.ufit.server.controller;

import com.ufit.server.dto.response.StaffDashboard;
import com.ufit.server.service.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasAuthority('ROLE_STAFF')")
public class StaffController {

    @Autowired private StaffService staffService;

    @GetMapping("/dashboard")
    public StaffDashboard dashboard() {
        return staffService.getDashboard();
    }
}
