// src/main/java/com/ufit/server/service/AdminService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.AdminDashboard;

public interface AdminService {
    AdminDashboard getDashboard();
    void assignRole(String username, String role);
}
