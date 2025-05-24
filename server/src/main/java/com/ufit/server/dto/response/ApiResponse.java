package com.ufit.server.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private String result;    // SUCCESS or ERROR
    private String message;   // success or error message
    private T data;           // return object from service class, if successful
    
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>("SUCCESS", message, data);
    }
    
    public static <T> ApiResponse<T> error(String message, T data) {
        return new ApiResponse<>("ERROR", message, data);
    }
    
    public static ApiResponse<?> error(String message) {
        return new ApiResponse<>("ERROR", message, null);
    }
} 