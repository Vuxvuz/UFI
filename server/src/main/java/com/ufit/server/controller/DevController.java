// src/main/java/com/ufit/server/controller/DevController.java
package com.ufit.server.controller;

import com.ufit.server.dto.response.DevDashboard;
import com.ufit.server.service.DevService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev")
@PreAuthorize("hasAuthority('ROLE_DEV')")
public class DevController {

    @Autowired private DevService devService;

    @GetMapping("/dashboard")
    public DevDashboard dashboard() {
        return devService.getDashboard();
    }
}
