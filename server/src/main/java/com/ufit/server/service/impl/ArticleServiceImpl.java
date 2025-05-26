package com.ufit.server.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ufit.server.dto.ArticleDTO;
import com.ufit.server.entity.Article;
import com.ufit.server.repository.ArticleRepository;
import com.ufit.server.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.ArrayList;
import java.util.Date;
import java.time.LocalDateTime;

@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    @Transactional
    public void loadArticlesFromJson() throws IOException {
        ClassPathResource resource = new ClassPathResource("cleaned_output.json");
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> articleData = mapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<Map<String, Object>>>() {}
        );
        
        System.out.println("Found " + articleData.size() + " articles in JSON file");
        
        int savedCount = 0;
        for (Map<String, Object> data : articleData) {
            String href = (String) data.get("href");
            if (!articleRepository.existsByHref(href)) {
                Article article = new Article();
                article.setHref(href);
                article.setTitle((String) data.get("title"));
                article.setContent((String) data.get("content"));
                article.setCategory((String) data.get("category"));
                article.setAuthor((String) data.get("author"));
                article.setImageUrl((String) data.get("imageUrl"));
                
                articleRepository.save(article);
                savedCount++;
            }
        }
        
        System.out.println("Saved " + savedCount + " new articles to database");
    }

    @Override
    public List<Article> getArticlesByCategory(String category) {
        return articleRepository.findByCategory(category);
    }

    @Override
    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }
    
    @Override
    @Transactional
    public void deleteAllArticles() {
        articleRepository.deleteAll();
        System.out.println("✅ All articles have been deleted from the database.");
    }

    @Override
    public List<ArticleDTO> getLatestArticles() {
        return articleRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public Map<String, Long> getArticleCounts() {
        // Lấy số lượng bài viết theo category
        List<Object[]> results = articleRepository.countByCategory();
        Map<String, Long> counts = new HashMap<>();
        
        for (Object[] result : results) {
            String category = (String) result[0];
            Long count = (Long) result[1];
            counts.put(category, count);
        }
        
        return counts;
    }
    
    @Override
    public List<ArticleDTO> searchArticles(String query) {
        // Tìm kiếm trong title và content
        String searchQuery = "%" + query.toLowerCase() + "%";
        List<Article> results = articleRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(searchQuery, searchQuery);
        return results.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public Optional<ArticleDTO> getArticleById(Long id) {
        return articleRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    @Override
    public List<String> getAllDistinctCategories() {
        return articleRepository.findDistinctCategories();
    }
    
    @Override
    public void loadSampleArticles() {
        // Kiểm tra xem đã có bài viết chưa
        if (articleRepository.count() > 0) {
            return; // Nếu đã có dữ liệu, không thêm nữa
        }
        
        // Thêm một số bài viết mẫu
        List<Article> sampleArticles = new ArrayList<>();
        
        // Bài viết mind
        Article mindArticle = new Article();
        mindArticle.setTitle("Cải thiện sức khỏe tinh thần trong mùa dịch");
        mindArticle.setContent("Mùa dịch COVID-19 đã gây ra nhiều áp lực tâm lý...");
        mindArticle.setCategory("mind");
        mindArticle.setImageUrl("https://example.com/mental-health.jpg");
        mindArticle.setCreatedAt(LocalDateTime.now());
        mindArticle.setUpdatedAt(LocalDateTime.now());
        sampleArticles.add(mindArticle);
        
        // Bài viết nutrition
        Article nutritionArticle = new Article();
        nutritionArticle.setTitle("10 thực phẩm tốt cho sức khỏe tim mạch");
        nutritionArticle.setContent("Chế độ ăn uống đóng vai trò quan trọng trong việc bảo vệ tim mạch...");
        nutritionArticle.setCategory("nutrition");
        nutritionArticle.setImageUrl("https://example.com/heart-foods.jpg");
        nutritionArticle.setCreatedAt(LocalDateTime.now());
        nutritionArticle.setUpdatedAt(LocalDateTime.now());
        sampleArticles.add(nutritionArticle);
        
        // Bài viết drug
        Article drugArticle = new Article();
        drugArticle.setTitle("Hiểu đúng về thuốc hạ sốt");
        drugArticle.setContent("Thuốc hạ sốt là loại thuốc thường được sử dụng...");
        drugArticle.setCategory("drug");
        drugArticle.setImageUrl("https://example.com/fever-medicine.jpg");
        drugArticle.setCreatedAt(LocalDateTime.now());
        drugArticle.setUpdatedAt(LocalDateTime.now());
        sampleArticles.add(drugArticle);
        
        // Bài viết recipe
        Article recipeArticle = new Article();
        recipeArticle.setTitle("Công thức salad rau củ giàu vitamin");
        recipeArticle.setContent("Salad rau củ không chỉ ngon miệng mà còn bổ dưỡng...");
        recipeArticle.setCategory("recipe");
        recipeArticle.setImageUrl("https://example.com/salad.jpg");
        recipeArticle.setCreatedAt(LocalDateTime.now());
        recipeArticle.setUpdatedAt(LocalDateTime.now());
        sampleArticles.add(recipeArticle);
        
        // Lưu danh sách bài viết vào database
        articleRepository.saveAll(sampleArticles);
    }
    
    private ArticleDTO convertToDTO(Article article) {
        return new ArticleDTO(
            article.getId(),
            article.getTitle(),
            article.getContent(),
            article.getCategory(),
            article.getAuthor(),
            article.getCreatedAt(),
            article.getImageUrl()
        );
    }
}
