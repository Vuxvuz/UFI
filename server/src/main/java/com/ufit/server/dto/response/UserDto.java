package com.ufit.server.dto.response;

public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String role;

    // Default constructor
    public UserDto() {}

    // Getters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }

    // Setters - THÊM NHỮNG CÁI NÀY
    public void setId(Long id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(String role) { this.role = role; }
}