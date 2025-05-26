package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.WHODataDto;
import com.ufit.server.service.WHOApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/who")
@CrossOrigin(origins = "http://localhost:3000")
public class WHOController {

    @Autowired
    private WHOApiService whoApiService;

    @GetMapping("/news")
    public ResponseEntity<ApiResponse<List<WHODataDto>>> getWhoNews() {
        try {
            List<WHODataDto> newsList = whoApiService.fetchLatestNews();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "WHO news fetched successfully", newsList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }
}
