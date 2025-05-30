// src/main/java/com/ufit/server/controller/UserController.java
package com.ufit.server.controller;

import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/user")
// Cho bất kỳ user đã xác thực (ROLE_USER, ROLE_ADMIN, ROLE_STAFF, ROLE_DEV…) đều được
@PreAuthorize("isAuthenticated()")
public class UserController {
    @Autowired private UserService userService;

    @GetMapping("/profile")
    public UserProfile getProfile(Principal principal) {
        return userService.getProfile(principal.getName());
    }

    @PutMapping("/profile")
    public UserProfile updateProfile(Principal principal,
                                     @RequestBody UserProfile profile) {
        return userService.updateProfile(principal.getName(), profile);
    }
}