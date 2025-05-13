// server/src/main/java/com/ufit/server/controller/ProfileController.java
package com.ufit.server.controller;

import com.ufit.server.dto.request.ProfileUpdateRequest;
import com.ufit.server.dto.response.ProfileResponse;
import com.ufit.server.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;
    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Principal principal) {
        ProfileResponse resp = profileService.getProfile(principal.getName());
        return ResponseEntity.ok(resp);
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            Principal principal,
            @RequestBody ProfileUpdateRequest request) {
        ProfileResponse resp = profileService.updateProfile(principal.getName(), request);
        return ResponseEntity.ok(resp);
    }
}
