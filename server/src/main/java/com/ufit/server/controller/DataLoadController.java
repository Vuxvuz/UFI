package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.service.ArticleService;
import com.ufit.server.exception.GlobalExceptionHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@RequestMapping("/api/admin/data")
public class DataLoadController {

    private static final Logger logger = LoggerFactory.getLogger(DataLoadController.class);

    @Autowired
    private ArticleService articleService;

    // === SINGLE FILE OPERATIONS ===
    
    @PostMapping("/load-single")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> loadSingleFile(
            @RequestParam String fileName) {
        logger.info("Loading single file: {}", fileName);
        try {
            Map<String, Integer> stats = articleService.loadArticlesWithStats(fileName);
            
            ApiResponse<Map<String, Integer>> response = new ApiResponse<>(
                "SUCCESS", 
                "File loaded successfully: " + fileName, 
                stats
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to load file: {}", fileName, e);
            ApiResponse<Map<String, Integer>> response = new ApiResponse<>(
                "ERROR", 
                "Failed to load file: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/load-multiple")
    public ResponseEntity<ApiResponse<Map<String, Object>>> loadMultipleFiles(
            @RequestBody List<String> fileNames) {
        logger.info("Loading multiple files: {}", fileNames);
        try {
            Map<String, Object> results = new HashMap<>();
            int totalLoaded = 0;
            int totalSkipped = 0;
            int successfulFiles = 0;
            
            for (String fileName : fileNames) {
                try {
                    Map<String, Integer> fileStats = articleService.loadArticlesWithStats(fileName);
                    results.put(fileName, fileStats);
                    totalLoaded += fileStats.get("loaded");
                    totalSkipped += fileStats.get("skipped");
                    successfulFiles++;
                } catch (Exception e) {
                    logger.error("Failed to load file: {}", fileName, e);
                    results.put(fileName, "Error: " + e.getMessage());
                }
            }
            
            results.put("summary", Map.of(
                "totalFiles", fileNames.size(),
                "successfulFiles", successfulFiles,
                "totalLoaded", totalLoaded,
                "totalSkipped", totalSkipped
            ));
            
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                "SUCCESS", 
                "Multiple files processed. " + successfulFiles + "/" + fileNames.size() + " successful", 
                results
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to load multiple files", e);
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                "ERROR", 
                "Failed to load files: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/load-directory")
    public ResponseEntity<ApiResponse<String>> loadDirectory(
            @RequestParam String directoryPath) {
        logger.info("Loading directory: {}", directoryPath);
        try {
            articleService.scanAndLoadAllJsonFiles(directoryPath);
            
            ApiResponse<String> response = new ApiResponse<>(
                "SUCCESS", 
                "Directory loaded successfully: " + directoryPath, 
                directoryPath
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to load directory: {}", directoryPath, e);
            ApiResponse<String> response = new ApiResponse<>(
                "ERROR", 
                "Failed to load directory: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/load-all-resources")
    public ResponseEntity<ApiResponse<String>> loadAllFromResources() {
        logger.info("Loading all JSON files from resources");
        try {
            articleService.loadAllJsonFilesFromResources();
            
            ApiResponse<String> response = new ApiResponse<>(
                "SUCCESS", 
                "All JSON files from resources loaded successfully", 
                "resources"
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to load from resources", e);
            ApiResponse<String> response = new ApiResponse<>(
                "ERROR", 
                "Failed to load from resources: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === LEGACY ENDPOINTS (for backward compatibility) ===
    
    @GetMapping("/load-articles")
    public ResponseEntity<String> loadArticlesLegacy() {
        logger.info("Loading articles (legacy endpoint)");
        try {
            articleService.loadArticlesFromJson();
            long total = articleService.getTotalArticleCount();
            return ResponseEntity.ok("✅ Loaded articles from cleaned_output.json! Total in DB: " + total);
        } catch (IOException e) {
            logger.error("Failed to load articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Failed to load articles: " + e.getMessage());
        }
    }
    
    // === CLEAR DATA OPERATIONS ===
    
    @DeleteMapping("/clear-all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearAllArticles() {
        logger.info("Clearing all articles");
        try {
            long countBefore = articleService.getTotalArticleCount();
            articleService.deleteAllArticles();
            long countAfter = articleService.getTotalArticleCount();
            
            Map<String, Object> result = Map.of(
                "deletedCount", countBefore,
                "remainingCount", countAfter
            );
            
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                "SUCCESS", 
                "All articles deleted successfully", 
                result
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to delete articles", e);
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                "ERROR", 
                "Failed to delete articles: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/clear-articles")
    public ResponseEntity<String> clearArticlesLegacy() {
        logger.info("Clearing articles (legacy endpoint)");
        try {
            articleService.deleteAllArticles();
            return ResponseEntity.ok("✅ All articles have been cleared from the database.");
        } catch (Exception e) {
            logger.error("Failed to clear articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Failed to clear articles: " + e.getMessage());
        }
    }

    @DeleteMapping("/clear-source/{source}")
    public ResponseEntity<ApiResponse<String>> clearBySource(@PathVariable String source) {
        logger.info("Clearing articles by source: {}", source);
        try {
            articleService.deleteBySource(source);
            
            ApiResponse<String> response = new ApiResponse<>(
                "SUCCESS", 
                "Articles from source '" + source + "' deleted successfully", 
                source
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to delete articles from source: {}", source, e);
            ApiResponse<String> response = new ApiResponse<>(
                "ERROR", 
                "Failed to delete articles from source: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // === SYSTEM STATUS ===
    
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        logger.info("Getting system status");
        try {
            Map<String, Object> status = new HashMap<>();
            status.put("totalArticles", articleService.getTotalArticleCount());
            status.put("categoriesCount", articleService.getAllDistinctCategories().size());
            status.put("sourcesCount", articleService.getAllDistinctSources().size());
            status.put("health", articleService.getSystemHealth());
            status.put("timestamp", System.currentTimeMillis());
            
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                "SUCCESS", 
                "System status retrieved successfully", 
                status
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to get system status", e);
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                "ERROR", 
                "Failed to get system status: " + e.getMessage(), 
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}