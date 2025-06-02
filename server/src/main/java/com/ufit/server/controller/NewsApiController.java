package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.NewsApiArticleDto;
import com.ufit.server.service.NewsApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/newsapi")
@CrossOrigin(origins = "http://localhost:3000")
public class NewsApiController {

    @Autowired
    private NewsApiService newsApiService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<List<NewsApiArticleDto>>> getHealthNews() {
        try {
            List<NewsApiArticleDto> news = newsApiService.fetchHealthNews();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Health news fetched successfully", news));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("ERROR", e.getMessage(), null));
        }
    }

    // Thêm endpoint mới này vào
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<NewsApiArticleDto>>> getLatestNews() {
        try {
            List<NewsApiArticleDto> latestNews = newsApiService.fetchLatestNews();
            return ResponseEntity.ok(new ApiResponse<>("SUCCESS", "Latest news fetched successfully", latestNews));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>("ERROR", "Error fetching latest news: " + e.getMessage(), null));
        }
    }
}
