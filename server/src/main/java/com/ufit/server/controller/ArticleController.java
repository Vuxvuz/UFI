package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.ArticleDTO;
import com.ufit.server.entity.Article;
import com.ufit.server.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/articles")
public class ArticleController {

    private static final Logger logger = LoggerFactory.getLogger(ArticleController.class);

    @Autowired
    private ArticleService articleService;

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Article>> getArticlesByCategory(@PathVariable String category) {
        logger.info("Fetching articles for category: {}", category);
        try {
            List<Article> articles = articleService.getArticlesByCategory(category.toLowerCase());
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            logger.error("Error fetching articles for category: {}", category, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{category}")
    public ResponseEntity<ApiResponse<?>> getArticlesByCategoryDirect(@PathVariable String category) {
        logger.info("Direct request for category: {}", category);
        
        // Kiểm tra xem category có phải là một số không (có thể là ID)
        if (category.matches("\\d+")) {
            try {
                Long id = Long.parseLong(category);
                Optional<ArticleDTO> article = articleService.getArticleById(id);
                
                if (article.isPresent()) {
                    ApiResponse<ArticleDTO> response = new ApiResponse<>("SUCCESS", "Article retrieved successfully", article.get());
                    return ResponseEntity.ok(response);
                } else {
                    ApiResponse<?> response = new ApiResponse<>("ERROR", "Article not found", null);
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }
            } catch (NumberFormatException e) {
                // Xử lý nếu không thể chuyển đổi thành Long
                logger.warn("Failed to parse {} as Long, treating as category", category);
            }
        }
        
        try {
            List<Article> articles = articleService.getArticlesByCategory(category.toLowerCase());
            if (articles.isEmpty()) {
                logger.warn("Invalid category requested: {}", category);
                ApiResponse<?> response = new ApiResponse<>("ERROR", "No articles found for category: " + category, null);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            ApiResponse<List<Article>> response = new ApiResponse<>("SUCCESS", "Articles retrieved successfully", articles);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching articles for category: {}", category, e);
            ApiResponse<?> response = new ApiResponse<>("ERROR", "Error retrieving articles: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Article>> getAllArticles() {
        logger.info("Fetching all articles");
        try {
            List<Article> articles = articleService.getAllArticles();
            logger.info("Found {} total articles", articles.size());
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            logger.error("Error fetching all articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Article>> getAllArticlesAlternative() {
        logger.info("Fetching all articles (alternative endpoint)");
        try {
            List<Article> articles = articleService.getAllArticles();
            logger.info("Found {} total articles", articles.size());
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            logger.error("Error fetching all articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<?>> getLatestArticles() {
        logger.info("Fetching latest articles");
        try {
            List<ArticleDTO> articles = articleService.getLatestArticles();
            ApiResponse<List<ArticleDTO>> response = new ApiResponse<>("SUCCESS", "Latest articles retrieved successfully", articles);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching latest articles", e);
            ApiResponse<?> response = new ApiResponse<>("ERROR", "Error retrieving latest articles: " + e.getMessage(), null);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getArticleCounts() {
        logger.info("Received request for article counts");
        try {
            Map<String, Long> counts = articleService.getArticleCounts();
            logger.info("Returning article counts: {}", counts);
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            logger.error("Error fetching article counts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ArticleDTO>> searchArticles(@RequestParam String query) {
        logger.info("Received search request with query: {}", query);
        try {
            List<ArticleDTO> results = articleService.searchArticles(query);
            logger.info("Found {} results for query '{}'", results.size(), query);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            logger.error("Error searching articles with query: {}", query, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkApi() {
        logger.info("Check endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "API is working");
        response.put("timestamp", System.currentTimeMillis());
        
        try {
            long articleCount = articleService.getAllArticles().size();
            response.put("totalArticles", articleCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking API status", e);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        logger.info("Fetching all distinct categories");
        try {
            List<String> categories = articleService.getAllDistinctCategories();
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            logger.error("Error fetching categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/load-sample")
    public ResponseEntity<?> loadSampleArticles() {
        logger.info("Loading sample articles");
        try {
            // Thêm một số bài viết mẫu cho mỗi danh mục
            articleService.loadSampleArticles();
            return ResponseEntity.ok("Sample articles loaded successfully");
        } catch (Exception e) {
            logger.error("Error loading sample articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error loading sample articles");
        }
    }
}