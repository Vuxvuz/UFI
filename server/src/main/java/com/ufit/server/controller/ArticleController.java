package com.ufit.server.controller;

import com.ufit.server.dto.response.ApiResponse;
import com.ufit.server.dto.response.ArticleDto;
import com.ufit.server.entity.Article;
import com.ufit.server.service.ArticleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.List;

/**
 * Controller để expose toàn bộ endpoint liên quan đến Article.
 * Giữ nguyên các "legacy" endpoint (/all, /clear, /load-sample, /load-from-directory),
 * đồng thời bổ sung endpoint trả về DTO (ArticleDto) cho front-end.
 */
@RestController
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:3001" })
@RequestMapping("/api/articles")
public class ArticleController {

    private static final Logger logger = LoggerFactory.getLogger(ArticleController.class);

    @Autowired
    private ArticleService articleService;

    // === BASIC ENDPOINTS ===

    /**
     * Lấy toàn bộ Article (as DTO) dưới dạng List<ArticleDto>.
     * Updated: now returns DTOs instead of entities.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ArticleDto>>> getAllArticles() {
        logger.info("Fetching all articles");
        try {
            List<ArticleDto> articles = articleService.getAllArticles();
            logger.info("Found {} total articles", articles.size());

            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Articles retrieved successfully",
                    articles
            );
            logger.info("Returning {} articles in response", articles.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching all articles. Error message: {}", e.getMessage(), e);
            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving articles: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Lấy Article theo "id hoặc theo category".
     * - Nếu {idOrCategory} là số (ví dụ: "123"), trả về một ArticleDto (nội dung chi tiết).
     * - Nếu không phải số (ví dụ: "health"), trả về List<ArticleDto> theo category.
     */
    @GetMapping("/{idOrCategory}")
    public ResponseEntity<ApiResponse<?>> getByIdOrCategory(@PathVariable String idOrCategory) {
        logger.info("Request for: {}", idOrCategory);

        // Nếu là numeric ID → trả về ArticleDto
        if (idOrCategory.matches("\\d+")) {
            try {
                Long id = Long.parseLong(idOrCategory);
                Optional<ArticleDto> articleOpt = articleService.getArticleById(id);

                if (articleOpt.isPresent()) {
                    ApiResponse<ArticleDto> response = new ApiResponse<>(
                            "SUCCESS",
                            "Article retrieved successfully",
                            articleOpt.get()
                    );
                    return ResponseEntity.ok(response);
                } else {
                    ApiResponse<?> response = new ApiResponse<>(
                            "ERROR",
                            "Article not found",
                            null
                    );
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse {} as Long", idOrCategory);
            }
        }

        // Nếu không phải số → coi như category, now returns DTOs
        try {
            List<ArticleDto> articles = articleService.getArticlesByCategory(idOrCategory.toLowerCase());
            if (articles.isEmpty()) {
                ApiResponse<?> response = new ApiResponse<>(
                        "ERROR",
                        "No articles found for category: " + idOrCategory,
                        null
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Articles for category retrieved successfully",
                    articles
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching articles for category: {}", idOrCategory, e);
            ApiResponse<?> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving articles: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === SEARCH ENDPOINTS ===

    /**
     * Tìm kiếm Article (trả về DTO).
     * GET /api/articles/search?query=…
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ArticleDto>>> searchArticles(@RequestParam String query) {
        logger.info("Searching articles with query: {}", query);
        try {
            List<ArticleDto> articles = articleService.searchArticles(query);

            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Search completed successfully",
                    articles
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error searching articles", e);
            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "ERROR",
                    "Search error: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Lấy các Article mới nhất (mặc định 5) dưới dạng DTO.
     * GET /api/articles/latest
     */
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<ArticleDto>>> getLatestArticles() {
        logger.info("Fetching latest articles");
        try {
            int defaultCount = 5;
            List<ArticleDto> articles = articleService.getLatestArticles(defaultCount);
            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Latest articles retrieved successfully",
                    articles
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching latest articles", e);
            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving latest articles: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Lấy các Article mới nhất theo category (trả về DTO).
     * GET /api/articles/latest/{category}?limit=…
     */
    @GetMapping("/latest/{category}")
    public ResponseEntity<ApiResponse<List<ArticleDto>>> getLatestByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "5") int limit) {
        logger.info("Fetching latest {} articles for category: {}", limit, category);
        try {
            List<ArticleDto> articles = articleService.getLatestArticlesByCategory(category, limit);
            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Latest articles for category retrieved successfully",
                    articles
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching latest articles for category: {}", category, e);
            ApiResponse<List<ArticleDto>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving articles: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === METADATA ENDPOINTS ===

    /**
     * Lấy danh sách tất cả category có trong DB.
     * GET /api/articles/categories
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getAllCategories() {
        logger.info("Fetching all distinct categories");
        try {
            List<String> categories = articleService.getAllDistinctCategories();
            logger.info("Found {} categories", categories.size());

            ApiResponse<List<String>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Categories retrieved successfully",
                    categories
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching categories", e);
            ApiResponse<List<String>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving categories: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Lấy danh sách tất cả source có trong DB.
     * GET /api/articles/sources
     */
    @GetMapping("/sources")
    public ResponseEntity<ApiResponse<List<String>>> getAllSources() {
        logger.info("Fetching all distinct sources");
        try {
            List<String> sources = articleService.getAllDistinctSources();

            ApiResponse<List<String>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Sources retrieved successfully",
                    sources
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching sources", e);
            ApiResponse<List<String>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving sources: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === STATISTICS ENDPOINTS ===

    /**
     * Lấy thống kê số bài theo category.
     * GET /api/articles/stats/counts
     */
    @GetMapping("/stats/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getArticleCounts() {
        logger.info("Fetching article counts by category");
        try {
            Map<String, Long> counts = articleService.getArticleCounts();
            logger.info("Returning article counts: {}", counts);

            ApiResponse<Map<String, Long>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Article counts retrieved successfully",
                    counts
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching article counts", e);
            ApiResponse<Map<String, Long>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving counts: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Lấy thống kê số bài theo source.
     * GET /api/articles/stats/sources
     */
    @GetMapping("/stats/sources")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getArticleCountsBySource() {
        logger.info("Fetching article counts by source");
        try {
            Map<String, Long> counts = articleService.getArticleCountsBySource();

            ApiResponse<Map<String, Long>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Article counts by source retrieved successfully",
                    counts
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching article counts by source", e);
            ApiResponse<Map<String, Long>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving source counts: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Lấy thống kê chi tiết (byCategory, bySource, general).
     * GET /api/articles/stats/detailed
     */
    @GetMapping("/stats/detailed")
    public ResponseEntity<ApiResponse<Map<String, Map<String, Long>>>> getDetailedStatistics() {
        logger.info("Fetching detailed statistics");
        try {
            Map<String, Map<String, Long>> stats = articleService.getDetailedStatistics();

            ApiResponse<Map<String, Map<String, Long>>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Detailed statistics retrieved successfully",
                    stats
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching detailed statistics", e);
            ApiResponse<Map<String, Map<String, Long>>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving statistics: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === UTILITY ENDPOINTS ===

    /**
     * Xóa hết bài theo source.
     * DELETE /api/articles/source/{source}
     */
    @DeleteMapping("/source/{source}")
    public ResponseEntity<ApiResponse<String>> deleteBySource(@PathVariable String source) {
        logger.info("Deleting articles from source: {}", source);
        try {
            articleService.deleteBySource(source);

            ApiResponse<String> response = new ApiResponse<>(
                    "SUCCESS",
                    "Articles from source '" + source + "' deleted successfully",
                    source
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deleting articles from source: {}", source, e);
            ApiResponse<String> response = new ApiResponse<>(
                    "ERROR",
                    "Error deleting articles from source: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Kiểm tra duplicate (title + URL).
     * GET /api/articles/duplicate-check?title=…&url=…
     */
    @GetMapping("/duplicate-check")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkDuplicate(
            @RequestParam String title,
            @RequestParam String url) {
        logger.info("Checking duplicate for title: {} and URL: {}", title, url);
        try {
            boolean isDuplicate = articleService.isDuplicateArticle(title, url);

            Map<String, Boolean> result = new HashMap<>();
            result.put("isDuplicate", isDuplicate);

            ApiResponse<Map<String, Boolean>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Duplicate check completed",
                    result
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            throw new RuntimeException("Error checking duplicate: " + e.getMessage(), e);
        }
    }

    /**
     * Lấy tổng số Article (chỉ count).
     * GET /api/articles/count
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTotalCount() {
        logger.info("Getting total article count");
        try {
            long totalCount = articleService.getTotalArticleCount();

            Map<String, Long> result = new HashMap<>();
            result.put("totalArticles", totalCount);

            ApiResponse<Map<String, Long>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Total article count retrieved successfully",
                    result
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting total count", e);
            ApiResponse<Map<String, Long>> response = new ApiResponse<>(
                    "ERROR",
                    "Error retrieving total count: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Health check (trả về một số thông tin cơ bản).
     * GET /api/articles/health
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemHealth() {
        logger.info("Health check requested");
        try {
            Map<String, Object> health = articleService.getSystemHealth();
            health.put("timestamp", System.currentTimeMillis());

            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                    "SUCCESS",
                    "System health retrieved successfully",
                    health
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error checking system health", e);
            Map<String, Object> errorHealth = new HashMap<>();
            errorHealth.put("status", "error");
            errorHealth.put("error", e.getMessage());
            errorHealth.put("timestamp", System.currentTimeMillis());

            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                    "ERROR",
                    "Health check failed",
                    errorHealth
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === LEGACY ENDPOINTS (for backward compatibility) ===

    /**
     * Legacy: Lấy all articles (trả về List<Article> entities, không đóng gói ApiResponse).
     * GET /api/articles/all
     * Uses the new getAllArticleEntities() method for backward compatibility.
     */
    @GetMapping("/all")
    public ResponseEntity<List<Article>> getAllArticlesLegacy() {
        logger.info("Fetching all articles (legacy endpoint)");
        try {
            List<Article> articles = articleService.getAllArticleEntities();
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            logger.error("Error fetching all articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Legacy: Load sample articles (nếu DB trống).
     * GET /api/articles/load-sample
     */
    @GetMapping("/load-sample")
    public ResponseEntity<String> loadSampleArticles() {
        logger.info("Loading sample articles");
        try {
            articleService.loadSampleArticles();
            return ResponseEntity.ok("✅ Sample articles loaded successfully");
        } catch (Exception e) {
            logger.error("Error loading sample articles", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("❌ Error loading sample articles: " + e.getMessage());
        }
    }

    /**
     * Legacy: Xóa toàn bộ Article (DELETE).
     * GET /api/articles/clear
     */
    @DeleteMapping("/clear")
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

    /**
     * Legacy: Load tất cả JSON từ một thư mục.
     * GET /api/articles/load-from-directory?directory=…
     */
    @GetMapping("/load-from-directory")
    public ResponseEntity<ApiResponse<Map<String, Object>>> loadFromDirectory(
            @RequestParam(defaultValue = "a/resources") String directory) {
        logger.info("Loading articles from directory: {}", directory);
        try {
            articleService.scanAndLoadAllJsonFiles(directory);

            Map<String, Object> result = new HashMap<>();
            result.put("directory", directory);
            result.put("status", "success");
            result.put("totalArticles", articleService.getTotalArticleCount());

            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                    "SUCCESS",
                    "Articles loaded successfully from directory: " + directory,
                    result
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to load articles from directory: {}", directory, e);
            ApiResponse<Map<String, Object>> response = new ApiResponse<>(
                    "ERROR",
                    "Failed to load articles: " + e.getMessage(),
                    null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{articleId}")
    public ResponseEntity<ApiResponse<String>> deleteArticle(
            @PathVariable Long articleId) {
        logger.info("Request to soft-delete article ID = {}", articleId);
        try {
            articleService.deleteArticleById(articleId);
            ApiResponse<String> response = new ApiResponse<>(
                "SUCCESS",
                "Article đã được xóa mềm",
                null
            );
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logger.error("Error soft-deleting article ID = {}", articleId, ex);
            ApiResponse<String> resp = new ApiResponse<>(
                "ERROR",
                "Không thể xóa article: " + ex.getMessage(),
                null
            );
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(resp);
        }
    }
}