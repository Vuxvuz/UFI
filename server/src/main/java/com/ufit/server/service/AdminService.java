// src/main/java/com/ufit/server/service/AdminService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.AdminDashboard;
import com.ufit.server.dto.response.UserProfile;
import com.ufit.server.dto.response.UserDto;
import java.util.List;

public interface AdminService {
    AdminDashboard getDashboard();
    void assignRole(String username, String role);
    UserProfile getUserProfile(String username);
    List<UserDto> getAllUsers();
}
