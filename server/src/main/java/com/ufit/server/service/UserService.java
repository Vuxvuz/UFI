// src/main/java/com/ufit/server/service/UserService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.dto.request.ChangePasswordRequest;

public interface UserService {
    UserProfile getProfile(String username);
    UserProfile updateProfile(String username, UserProfile updated);
    void changePassword(String username, ChangePasswordRequest request);
}
