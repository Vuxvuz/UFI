package com.ufit.server.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ufit.server.dto.response.ArticleDto;
import com.ufit.server.entity.Article;
import com.ufit.server.repository.ArticleRepository;
import com.ufit.server.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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
            ClassPathResource resource = new ClassPathResource(fileName);
            if (!resource.exists()) {
                System.err.println("❌ File not found: " + fileName);
                return;
            }
            
            List<Map<String, Object>> articleData = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<Map<String, Object>>>() {}
            );
            
            System.out.println("📄 Processing file: " + fileName);
            System.out.println("📊 Found " + articleData.size() + " articles in " + fileName);
            
            Map<String, Integer> stats = processAndSaveArticles(articleData, fileName);
            
            System.out.println("✅ Processing completed for " + fileName);
            System.out.println("   📝 Saved: " + stats.get("saved"));
            System.out.println("   ⏭️ Skipped: " + stats.get("skipped"));
            System.out.println("   ❌ Errors: " + stats.get("errors"));
            
        } catch (Exception e) {
            System.err.println("❌ Error processing file " + fileName + ": " + e.getMessage());
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
                .map(Resource::getFilename)
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
        ClassPathResource resource = new ClassPathResource(fileName);
        if (!resource.exists()) {
            throw new IOException("File not found: " + fileName);
        }
        
        List<Map<String, Object>> articleData = objectMapper.readValue(
            resource.getInputStream(),
            new TypeReference<List<Map<String, Object>>>() {}
        );
        
        return processAndSaveArticles(articleData, fileName);
    }

    // === PROCESSING HELPERS ===
    private Map<String, Integer> processAndSaveArticles(List<Map<String, Object>> articleData, String fileName) {
        int savedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;
        String sourceFromFileName = extractSourceFromFileName(fileName);
        
        for (int i = 0; i < articleData.size(); i++) {
            try {
                Map<String, Object> data = articleData.get(i);
                
                // Validate required fields
                if (!isValidArticleData(data)) {
                    errorCount++;
                    continue;
                }
                
                String url = getUrlFromData(data);
                
                // Check for duplicates
                if (articleRepository.existsByHref(url)) {
                    skippedCount++;
                    continue;
                }
                
                // Create and save article
                Article article = createArticleFromData(data, sourceFromFileName);
                article.calculateMetrics();
                article.generateContentHash();
                
                // Check for content duplicates
                if (isDuplicateContent(article)) {
                    skippedCount++;
                    System.out.println("   🔄 Duplicate content detected: " + article.getTitle());
                    continue;
                }
                
                articleRepository.save(article);
                savedCount++;
                
                // Progress logging
                if (articleData.size() > 100 && (i + 1) % 50 == 0) {
                    System.out.println("   📊 Progress: " + (i + 1) + "/" + articleData.size() + " processed");
                }
                
            } catch (Exception e) {
                errorCount++;
                System.err.println("❌ Error processing article " + (i + 1) + ": " + e.getMessage());
            }
        }
        
        return Map.of("saved", savedCount, "skipped", skippedCount, "errors", errorCount);
    }

    private boolean isValidArticleData(Map<String, Object> data) {
        // Updated validation for new format: title, url, content, category
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
        
        // Fallback: href, link, source_url ...
        for (String field : Arrays.asList("href", "link", "source_url")) {
            Object value = data.get(field);
            if (value != null && !value.toString().trim().isEmpty()) {
                return value.toString();
            }
        }
        
        // Nếu không tìm được, tạo URL tự động
        return "generated://" + System.currentTimeMillis() + "/" + data.get("title").hashCode();
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

    // === BASIC CRUD (đã chuyển sang trả DTO) ===

    @Override
    public List<ArticleDto> getArticlesByCategory(String category) {
        // Lấy danh sách entity, rồi map sang DTO
        return articleRepository.findByCategoryAndIsActiveTrue(category.toLowerCase())
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public List<ArticleDto> getAllArticles() {
        // Lấy hết entity, lọc isActive, rồi map sang DTO
        return articleRepository.findAll().stream()
            .filter(Article::getIsActive)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<ArticleDto> getArticleById(Long id) {
        // Giữ nguyên: trả Optional<ArticleDto>
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

    @Override
    @Transactional
    public void deleteArticleById(Long articleId) {
        Article a = articleRepository.findById(articleId)
                .orElseThrow(() -> new NoSuchElementException("Article not found with id " + articleId));
        articleRepository.delete(a);
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
    return articleRepository.findAll(); // hoặc chỉ những entity cần thiết
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
}
