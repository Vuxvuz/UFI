// src/main/java/com/ufit/server/service/UserService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.UserProfile;

public interface UserService {
    UserProfile getProfile(String username);
    UserProfile updateProfile(String username, UserProfile updated);
}
