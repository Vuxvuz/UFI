package com.ufit.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import com.ufit.server.entity.Article;
import com.ufit.server.repository.ArticleRepository;
import com.ufit.server.dto.ArticleDTO;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Map;

public interface ArticleService {
    void loadArticlesFromJson() throws IOException;
    List<Article> getArticlesByCategory(String category);
    List<Article> getAllArticles();
    void deleteAllArticles();
    Optional<ArticleDTO> getArticleById(Long id);
    List<ArticleDTO> getLatestArticles();
    Map<String, Long> getArticleCounts();
    List<ArticleDTO> searchArticles(String query);
    List<String> getAllDistinctCategories();
    void loadSampleArticles();
}