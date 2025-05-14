// src/main/java/com/ufit/server/service/impl/DevServiceImpl.java
package com.ufit.server.service.impl;

import com.ufit.server.dto.response.DevDashboard;
import com.ufit.server.service.DevService;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class DevServiceImpl implements DevService {

    @Override
    public DevDashboard getDashboard() {
        // ví dụ giả lập
        String status = "GREEN";
        String lastDeployed = Instant.now().minusSeconds(3600).toString();
        return new DevDashboard(status, lastDeployed);
    }
}
