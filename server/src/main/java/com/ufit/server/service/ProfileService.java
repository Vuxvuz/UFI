package com.ufit.server.service;

import com.ufit.server.dto.request.ProfileUpdateRequest;
import com.ufit.server.dto.response.ProfileResponse;

public interface ProfileService {
    ProfileResponse getProfile(String username);
    ProfileResponse updateProfile(String username, ProfileUpdateRequest request);
}
