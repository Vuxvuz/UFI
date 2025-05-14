// src/main/java/com/ufit/server/service/DevService.java
package com.ufit.server.service;

import com.ufit.server.dto.response.DevDashboard;

public interface DevService {
    DevDashboard getDashboard();
    // Có thể thêm các method trigger CI, xem logs, v.v.
}
