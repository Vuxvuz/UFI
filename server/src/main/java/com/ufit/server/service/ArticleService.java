package com.ufit.server.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.ufit.server.entity.Article;
import com.ufit.server.dto.response.ArticleDto;

public interface ArticleService {
    // === LOAD METHODS ===
    void loadArticlesFromJson() throws IOException;
    void loadArticlesFromJson(String fileName) throws IOException;
    void loadMultipleJsonFiles(List<String> fileNames) throws IOException;
    void scanAndLoadAllJsonFiles(String directoryPath) throws IOException;
    void loadAllJsonFilesFromResources() throws IOException;
    Map<String, Integer> loadArticlesWithStats(String fileName) throws IOException;
    
    // NEW: Load articles in batch with detailed error reporting
    Map<String, Object> loadArticlesInBatch(String fileName, int batchSize) throws IOException;

    // === BASIC CRUD (đã đổi sang DTO) ===
    List<ArticleDto> getArticlesByCategory(String category);
    List<ArticleDto> getAllArticles();
    Optional<ArticleDto> getArticleById(Long id);
    void deleteAllArticles();
    void deleteBySource(String source);
    
    // === SEARCH & FILTER ===
    List<ArticleDto> searchArticles(String query);
    List<ArticleDto> getLatestArticles(int limit);
    List<ArticleDto> getLatestArticlesByCategory(String category, int limit);
    List<String> getAllDistinctCategories();
    List<String> getAllDistinctSources();
    List<Article> getAllArticleEntities();
    // === STATISTICS ===
    Map<String, Long> getArticleCounts();
    Map<String, Long> getArticleCountsBySource();
    Map<String, Map<String, Long>> getDetailedStatistics();
    
    // === SAMPLE DATA ===
    void loadSampleArticles();
    void deleteArticleById(Long articleId);
    
    // === UTILITIES ===
    boolean isDuplicateArticle(String title, String url);
    long getTotalArticleCount();
    Map<String, Object> getSystemHealth();

    // NEW: Load a single file with directory path
    Map<String, Object> loadSingleFile(String directory, String fileName) throws IOException;

}
