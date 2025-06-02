// src/main/java/com/ufit/server/dto/response/SystemInfoDto.java
package com.ufit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin hệ thống cho Admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemInfoDto {
    private String version;
    private String uptime;
    private long totalUsers;
    private long totalArticles;

    // Nếu bạn muốn custom constructor (không dùng Lombok) thì có thể viết như sau thay vì @AllArgsConstructor:
    // public SystemInfoDto(String version, String uptime, long totalUsers, long totalArticles) {
    //     this.version = version;
    //     this.uptime = uptime;
    //     this.totalUsers = totalUsers;
    //     this.totalArticles = totalArticles;
    // }
}
