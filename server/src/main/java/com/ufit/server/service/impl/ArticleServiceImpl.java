package com.ufit.server.service.impl;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ufit.server.dto.response.ArticleDto;
import com.ufit.server.entity.Article;
import com.ufit.server.repository.ArticleRepository;
import com.ufit.server.service.ArticleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // === LOAD METHODS ===
    @Override
    @Transactional
    public void loadArticlesFromJson() throws IOException {
        loadArticlesFromJson("cleaned_output.json");
    }

    @Override
    @Transactional
    public void loadArticlesFromJson(String fileName) throws IOException {
        try {
            // Nếu fileName không chứa đường dẫn đầy đủ, sử dụng ClassPathResource mặc định
            ClassPathResource resource = new ClassPathResource(fileName);
            if (!resource.exists()) {
                log.error("❌ File not found: {}", fileName);
                throw new IOException("File not found: " + fileName);
            }
            
            Map<String, Object> stats = loadArticlesInBatch(fileName, 100);
            
            log.info("✅ Processing completed for {}", fileName);
            log.info("   📝 Saved: {}", stats.get("saved"));
            log.info("   ⏭️ Skipped: {}", stats.get("skipped"));
            log.info("   ❌ Errors: {}", stats.get("errors"));
            
        } catch (Exception e) {
            log.error("❌ Error processing file {}: {}", fileName, e.getMessage());
            throw new IOException("Failed to load articles from " + fileName, e);
        }
    }

    @Override
    @Transactional
    public void loadMultipleJsonFiles(List<String> fileNames) throws IOException {
        Map<String, Map<String, Integer>> allStats = new HashMap<>();
        
        for (String fileName : fileNames) {
            try {
                Map<String, Integer> stats = loadArticlesWithStats(fileName);
                allStats.put(fileName, stats);
            } catch (Exception e) {
                System.err.println("❌ Failed to load " + fileName + ": " + e.getMessage());
                allStats.put(fileName, Map.of("saved", 0, "skipped", 0, "errors", 1));
            }
        }
        
        printBatchSummary(allStats);
    }

    @Override
    @Transactional
    public void scanAndLoadAllJsonFiles(String directoryPath) throws IOException {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:" + directoryPath + "/*.json");
            
            List<String> fileNames = Arrays.stream(resources)
                .map(resource -> directoryPath + "/" + resource.getFilename())
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
                
            if (fileNames.isEmpty()) {
                System.out.println("⚠️ No JSON files found in directory: " + directoryPath);
                return;
            }
            
            System.out.println("🔍 Found " + fileNames.size() + " JSON files in " + directoryPath);
            loadMultipleJsonFiles(fileNames);
            
        } catch (Exception e) {
            throw new IOException("Failed to scan directory " + directoryPath, e);
        }
    }

    @Override
    @Transactional
    public void loadAllJsonFilesFromResources() throws IOException {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:*.json");
            
            List<String> fileNames = Arrays.stream(resources)
                .map(resource -> {
                    try {
                        return resource.getFilename();
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
                
            if (fileNames.isEmpty()) {
                System.out.println("⚠️ No JSON files found in resources root");
                return;
            }
            
            System.out.println("🔍 Found " + fileNames.size() + " JSON files in resources");
            loadMultipleJsonFiles(fileNames);
            
        } catch (Exception e) {
            throw new IOException("Failed to load all JSON files from resources", e);
        }
    }

    @Override
    @Transactional
    public Map<String, Integer> loadArticlesWithStats(String fileName) throws IOException {
        Map<String, Object> batchStats = loadArticlesInBatch(fileName, 100);
        return Map.of(
            "saved", ((Number) batchStats.get("saved")).intValue(),
            "skipped", ((Number) batchStats.get("skipped")).intValue(),
            "errors", ((Number) batchStats.get("errors")).intValue()
        );
    }

    @Override
    @Transactional
    public Map<String, Object> loadArticlesInBatch(String fileName, int batchSize) throws IOException {
        ClassPathResource resource = new ClassPathResource(fileName);
        if (!resource.exists()) {
            throw new IOException("File not found: " + fileName);
        }

        int savedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;
        List<Map<String, Object>> batch = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        String source = extractSourceFromFileName(fileName);

        // Tạo file log lỗi
        String errorLogFile = "error_log_" + fileName.replaceAll("[^a-zA-Z0-9]", "_") + ".json";
        FileWriter errorLog = new FileWriter(errorLogFile, false);

        try (JsonParser parser = objectMapper.getFactory().createParser(resource.getInputStream())) {
            // Kiểm tra array mở đầu
            if (parser.nextToken() != JsonToken.START_ARRAY) {
                throw new IOException("Invalid JSON: Expected array");
            }

            int index = 0;
            while (parser.nextToken() == JsonToken.START_OBJECT) {
                // Đọc từng article thành Map với type safety
                Map<String, Object> data = objectMapper.readValue(parser, new TypeReference<Map<String, Object>>() {});
                index++;

                // Validate dữ liệu
                if (!isValidArticleData(data)) {
                    errorCount++;
                    errorMessages.add("Invalid data at index " + index);
                    errorLog.write("{\"index\":" + index + ",\"error\":\"Invalid data\",\"data\":" + 
                        objectMapper.writeValueAsString(data) + "}\n");
                    continue;
                }

                batch.add(data);

                // Xử lý batch khi đủ kích thước
                if (batch.size() >= batchSize) {
                    Map<String, Integer> batchStats = processAndSaveBatch(batch, source, errorLog, index - batch.size() + 1);
                    savedCount += batchStats.get("saved");
                    skippedCount += batchStats.get("skipped");
                    errorCount += batchStats.get("errors");
                    batch.clear();
                    System.out.println("📊 Processed " + index + " articles");
                }
            }

            // Xử lý batch cuối (nếu còn)
            if (!batch.isEmpty()) {
                Map<String, Integer> batchStats = processAndSaveBatch(batch, source, errorLog, index - batch.size() + 1);
                savedCount += batchStats.get("saved");
                skippedCount += batchStats.get("skipped");
                errorCount += batchStats.get("errors");
            }

        } catch (Exception e) {
            errorCount++;
            errorMessages.add("Unexpected error: " + e.getMessage());
            errorLog.write("{\"error\":\"Unexpected error: " + e.getMessage() + "\"}\n");
            throw new IOException("Failed to process file " + fileName, e);
        } finally {
            try {
                errorLog.close();
            } catch (IOException e) {
                System.err.println("❌ Failed to close error log file: " + e.getMessage());
            }
        }

        System.out.println("✅ Processing completed for " + fileName);
        System.out.println("   📝 Saved: " + savedCount);
        System.out.println("   ⏭️ Skipped: " + skippedCount);
        System.out.println("   ❌ Errors: " + errorCount);
        System.out.println("   📜 Error log saved to: " + errorLogFile);

        Map<String, Object> stats = new HashMap<>();
        stats.put("saved", savedCount);
        stats.put("skipped", skippedCount);
        stats.put("errors", errorCount);
        stats.put("errorMessages", errorMessages);
        return stats;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private Map<String, Integer> processAndSaveBatch(List<Map<String, Object>> batch, String source, FileWriter errorLog, int startIndex) {
        int savedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;

        for (int i = 0; i < batch.size(); i++) {
            Map<String, Object> data = batch.get(i);
            int articleIndex = startIndex + i;

            try {
                String url = getUrlFromData(data);
                if (articleRepository.existsByHref(url)) {
                    skippedCount++;
                    try {
                        errorLog.write("{\"index\":" + articleIndex + ",\"error\":\"Duplicate href: " + url + "\"}\n");
                    } catch (IOException e) {
                        System.err.println("❌ Failed to write to error log: " + e.getMessage());
                    }
                    continue;
                }

                Article article = createArticleFromData(data, source);
                article.calculateMetrics();
                article.generateContentHash();

                if (isDuplicateContent(article)) {
                    skippedCount++;
                    try {
                        errorLog.write("{\"index\":" + articleIndex + ",\"error\":\"Duplicate content: " + article.getTitle() + "\"}\n");
                    } catch (IOException e) {
                        System.err.println("❌ Failed to write to error log: " + e.getMessage());
                    }
                    continue;
                }

                // Cắt nội dung nếu quá dài
                if (article.getContent() != null && article.getContent().length() > 1000000) {
                    log.warn("Truncating content for article: {}", article.getTitle());
                    article.setContent(article.getContent().substring(0, 1000000));
                }

                articleRepository.save(article);
                savedCount++;

            } catch (DataIntegrityViolationException e) {
                errorCount++;
                try {
                    errorLog.write("{\"index\":" + articleIndex + ",\"error\":\"Data integrity error: " + 
                        e.getMessage() + "\",\"data\":" + objectMapper.writeValueAsString(data) + "}\n");
                } catch (Exception ex) {
                    System.err.println("❌ Failed to write to error log: " + ex.getMessage());
                }
            } catch (Exception e) {
                errorCount++;
                try {
                    errorLog.write("{\"index\":" + articleIndex + ",\"error\":\"Unexpected error: " + 
                        e.getMessage() + "\",\"data\":" + objectMapper.writeValueAsString(data) + "}\n");
                } catch (Exception ex) {
                    System.err.println("❌ Failed to write to error log: " + ex.getMessage());
                }
            }
        }

        return Map.of("saved", savedCount, "skipped", skippedCount, "errors", errorCount);
    }

    private boolean isValidArticleData(Map<String, Object> data) {
        return data.get("title") != null &&
               data.get("content") != null &&
               data.get("category") != null &&
               data.get("url") != null &&
               !data.get("title").toString().trim().isEmpty() &&
               !data.get("content").toString().trim().isEmpty() &&
               !data.get("url").toString().trim().isEmpty();
    }

    private String getUrlFromData(Map<String, Object> data) {
        // Prioritize "url" field first
        Object url = data.get("url");
        if (url != null && !url.toString().trim().isEmpty()) {
            return url.toString();
        }
        
        // Fallback: href, link, source_url
        for (String field : Arrays.asList("href", "link", "source_url")) {
            Object value = data.get(field);
            if (value != null && !value.toString().trim().isEmpty()) {
                return value.toString();
            }
        }
        
        // Tạo URL tự động với UUID để đảm bảo duy nhất
        return "generated://" + UUID.randomUUID().toString();
    }

    private String extractSourceFromFileName(String fileName) {
        String name = fileName.toLowerCase();
        if (name.contains("medlineplus")) return "medlineplus";
        if (name.contains("harvard")) return "harvard";
        if (name.contains("mayo")) return "mayo-clinic";
        if (name.contains("webmd")) return "webmd";
        if (name.contains("healthline")) return "healthline";
        if (name.contains("nutrition")) return "nutrition";
        if (name.contains("drug")) return "drug-info";
        if (name.contains("recipe")) return "recipe";
        return fileName.replaceAll("\\.(json|JSON)$", "");
    }

    private Article createArticleFromData(Map<String, Object> data, String source) {
        Article article = new Article();
        
        article.setHref(getUrlFromData(data));
        article.setTitle(cleanString((String) data.get("title")));
        article.setContent(cleanString((String) data.get("content")));
        article.setCategory(cleanString((String) data.get("category")));
        article.setAuthor(cleanString((String) data.get("author")));
        article.setImageUrl(cleanString((String) data.get("imageUrl")));
        article.setSource(source);
        
        article.setDescription(cleanString((String) data.get("description")));
        article.setTags(cleanString((String) data.get("tags")));
        article.setLanguage(data.containsKey("language") ? (String) data.get("language") : "vi");
        
        article.setCreatedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());
        article.setIsActive(true);
        article.setIsProcessed(true);
        
        return article;
    }

    private String cleanString(String input) {
        if (input == null) return null;
        return input.trim().replaceAll("\\s+", " ");
    }

    private boolean isDuplicateContent(Article article) {
        if (article.getContentHash() == null) return false;
        return articleRepository.existsByContentHash(article.getContentHash());
    }

    private void printBatchSummary(Map<String, Map<String, Integer>> allStats) {
        System.out.println("\n📊 BATCH PROCESSING SUMMARY:");
        System.out.println("=".repeat(50));
        
        int totalSaved = 0, totalSkipped = 0, totalErrors = 0;
        
        for (Map.Entry<String, Map<String, Integer>> entry : allStats.entrySet()) {
            String fileName = entry.getKey();
            Map<String, Integer> stats = entry.getValue();
            
            int saved = stats.getOrDefault("saved", 0);
            int skipped = stats.getOrDefault("skipped", 0);
            int errors = stats.getOrDefault("errors", 0);
            
            totalSaved += saved;
            totalSkipped += skipped;
            totalErrors += errors;
            
            String status = errors > 0 ? "❌" : saved > 0 ? "✅" : "⚠️";
            System.out.printf("%s %-30s | Saved: %3d | Skipped: %3d | Errors: %3d%n",
                status, fileName, saved, skipped, errors);
        }
        
        System.out.println("=".repeat(50));
        System.out.printf("📈 TOTAL: Saved: %d | Skipped: %d | Errors: %d%n",
            totalSaved, totalSkipped, totalErrors);
        System.out.println("🎯 Current DB total: " + articleRepository.countByIsActiveTrue());
    }

    // === BASIC CRUD ===

    @Override
    public List<ArticleDto> getArticlesByCategory(String category) {
        return articleRepository.findByCategoryAndIsActiveTrue(category.toLowerCase())
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<ArticleDto> getAllArticles() {
        return articleRepository.findAll().stream()
            .filter(Article::getIsActive)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<ArticleDto> getArticleById(Long id) {
        return articleRepository.findById(id)
            .filter(Article::getIsActive)
            .map(this::convertToDTO);
    }

    @Override
    @Transactional
    public void deleteAllArticles() {
        articleRepository.deleteAll();
        System.out.println("✅ All articles have been deleted from the database.");
    }

    @Override
    @Transactional
    public void deleteBySource(String source) {
        articleRepository.deleteBySource(source);
        System.out.println("✅ All articles from source '" + source + "' have been deleted.");
    }

    // === PHƯƠNG THỨC XÓA MỀM ===
    @Override
    @Transactional
    public void deleteArticleById(Long articleId) {
        // Lấy bài viết theo ID
        Article article = articleRepository.findById(articleId)
            .orElseThrow(() -> new RuntimeException("Article không tồn tại với ID = " + articleId + ")"));

        if (!article.getIsActive()) {
            throw new RuntimeException("Article đã bị xóa trước đó với ID = " + articleId + ")");
        }

        // Soft-delete
        article.setIsActive(false);
        article.setUpdatedAt(LocalDateTime.now());
        articleRepository.save(article);

        System.out.println("✅ Soft-deleted article với ID = " + articleId);
    }

    // === SEARCH & FILTER ===
    @Override
    public List<ArticleDto> searchArticles(String query) {
        return articleRepository.searchActiveArticles(query).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<ArticleDto> getLatestArticles(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Article> articles = articleRepository.findTopNActiveArticles(pageable);
        return articles.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<ArticleDto> getLatestArticlesByCategory(String category, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<Article> articles = articleRepository.findTopNByCategoryAndActiveTrue(category, pageable);
        return articles.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllDistinctCategories() {
        return articleRepository.findDistinctCategories();
    }

    @Override
    public List<String> getAllDistinctSources() {
        return articleRepository.findDistinctSources();
    }

    // === STATISTICS ===
    @Override
    public Map<String, Long> getArticleCounts() {
        List<Object[]> results = articleRepository.countByCategory();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (String) result[0],
                result -> (Long) result[1]
            ));
    }

    @Override
    public Map<String, Long> getArticleCountsBySource() {
        List<Object[]> results = articleRepository.countBySource();
        return results.stream()
            .collect(Collectors.toMap(
                result -> (String) result[0],
                result -> (Long) result[1]
            ));
    }

    @Override
    public Map<String, Map<String, Long>> getDetailedStatistics() {
        Map<String, Map<String, Long>> stats = new HashMap<>();
        stats.put("byCategory", getArticleCounts());
        stats.put("bySource", getArticleCountsBySource());
        
        Map<String, Long> general = new HashMap<>();
        general.put("total", getTotalArticleCount());
        general.put("categories", (long) getAllDistinctCategories().size());
        general.put("sources", (long) getAllDistinctSources().size());
        stats.put("general", general);
        
        return stats;
    }

    // === SAMPLE DATA ===
    @Override
    public void loadSampleArticles() {
        if (articleRepository.count() > 0) {
            return;
        }
        
        List<Article> sampleArticles = createSampleArticles();
        sampleArticles.forEach(article -> {
            article.calculateMetrics();
            article.generateContentHash();
        });
        
        articleRepository.saveAll(sampleArticles);
        System.out.println("✅ Loaded " + sampleArticles.size() + " sample articles");
    }

    private List<Article> createSampleArticles() {
        List<Article> articles = new ArrayList<>();
        
        articles.add(new Article(
            "sample://mind-health",
            "Cải thiện sức khỏe tinh thần trong mùa dịch",
            "Mùa dịch COVID-19 đã gây ra nhiều áp lực tâm lý cho mọi người. Việc duy trì sức khỏe tinh thần trở nên quan trọng hơn bao giờ hết...",
            "mind",
            "Dr. Nguyen Van A",
            "https://example.com/mental-health.jpg",
            "sample-data"
        ));
        
        articles.add(new Article(
            "sample://nutrition-heart",
            "10 thực phẩm tốt cho sức khỏe tim mạch",
            "Chế độ ăn uống đóng vai trò quan trọng trong việc bảo vệ tim mạch. Dưới đây là 10 thực phẩm được khuyên dùng...",
            "nutrition",
            "BS. Tran Thi B",
            "https://example.com/heart-foods.jpg",
            "sample-data"
        ));
        
        articles.add(new Article(
            "sample://drug-fever",
            "Hiểu đúng về thuốc hạ sốt",
            "Thuốc hạ sốt là loại thuốc thường được sử dụng khi có triệu chứng sốt. Tuy nhiên, việc sử dụng cần tuân theo đúng hướng dẫn...",
            "drug",
            "Dược sĩ Le Van C",
            "https://example.com/fever-medicine.jpg",
            "sample-data"
        ));
        
        articles.add(new Article(
            "sample://recipe-salad",
            "Công thức salad rau củ giàu vitamin",
            "Salad rau củ không chỉ ngon miệng mà còn bổ dưỡng, cung cấp nhiều vitamin và khoáng chất cần thiết cho cơ thể...",
            "recipe",
            "Chef Pham Thi D",
            "https://example.com/salad.jpg",
            "sample-data"
        ));
        
        return articles;
    }

    // === UTILITIES ===
    @Override
    public boolean isDuplicateArticle(String title, String url) {
        return articleRepository.existsByHref(url) ||
               !articleRepository.findDuplicatesByTitle(title, url).isEmpty();
    }

    @Override
    public long getTotalArticleCount() {
        return articleRepository.countByIsActiveTrue();
    }

    @Override
    public List<Article> getAllArticleEntities() {
        return articleRepository.findAll();
    }

    @Override
    public Map<String, Object> getSystemHealth() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            List<Object[]> healthStats = articleRepository.getHealthStats();
            if (!healthStats.isEmpty()) {
                Object[] stats = healthStats.get(0);
                health.put("totalArticles", stats[0]);
                health.put("averageWordCount", stats[1]);
                health.put("lastUpdated", stats[2]);
            }
            
            health.put("categoriesCount", getAllDistinctCategories().size());
            health.put("sourcesCount", getAllDistinctSources().size());
            health.put("status", "healthy");
            
        } catch (Exception e) {
            health.put("status", "error");
            health.put("error", e.getMessage());
        }
        
        return health;
    }

    // === CONVERSION HELPERS ===
    private ArticleDto convertToDTO(Article article) {
        return new ArticleDto(
            article.getId(),
            article.getHref(),
            article.getTitle(),
            article.getContent(),
            article.getCategory(),
            article.getAuthor(),
            article.getImageUrl(),
            article.getSource(),
            article.getDescription(),
            article.getTags(),
            article.getIsActive(),
            article.getLanguage(),
            article.getWordCount(),
            article.getReadingTime(),
            article.getCreatedAt(),
            article.getUpdatedAt()
        );
    }

    @Override
    @Transactional
    public Map<String, Object> loadSingleFile(String directory, String fileName) throws IOException {
        try {
            // Tạo đường dẫn đầy đủ từ directory và fileName
            String fullPath = directory + (directory.endsWith("/") ? "" : "/") + fileName;
            ClassPathResource resource = new ClassPathResource(fullPath);
            if (!resource.exists()) {
                log.error("❌ File not found: {}", fullPath);
                throw new IOException("File not found: " + fullPath);
            }
            
            log.info("🔍 Loading file from path: {}", fullPath);
            Map<String, Object> stats = loadArticlesInBatch(fullPath, 100);
            
            log.info("✅ Processing completed for {}", fullPath);
            log.info("   📝 Saved: {}", stats.get("saved"));
            log.info("   ⏭️ Skipped: {}", stats.get("skipped"));
            log.info("   ❌ Errors: {}", stats.get("errors"));
            
            return stats;
        } catch (Exception e) {
            log.error("❌ Error processing file {}: {}", fileName, e.getMessage());
            throw new IOException("Failed to load articles from " + fileName, e);
        }
    }
}