package com.ufit.server.controller;

import com.ufit.server.dto.response.ModeratorDashboard;
import com.ufit.server.service.ModeratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/moderator")
@PreAuthorize("hasAuthority('ROLE_MODERATOR')")
public class ModeratorController {

    @Autowired private ModeratorService moderatorService;

    @GetMapping("/dashboard")
    public ModeratorDashboard dashboard() {
        return moderatorService.getDashboard();
    }
    
    // Additional endpoints for moderation can be added here
}
