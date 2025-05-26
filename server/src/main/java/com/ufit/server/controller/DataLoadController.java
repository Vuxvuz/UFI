package com.ufit.server.controller;

import com.ufit.server.service.ArticleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.io.IOException;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class DataLoadController {

    private final ArticleService articleService;

    public DataLoadController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping("/api/load-articles")
    public String loadArticles() {
        try {
            articleService.loadArticlesFromJson();
            long total = articleService.getAllArticles().size();
            return "✅ Loaded articles from cleaned_output.json! Total in DB: " + total;
        } catch (IOException e) {
            return "❌ Failed to load articles: " + e.getMessage();
        }
    }
    
    @GetMapping("/api/clear-articles")
    public String clearArticles() {
        articleService.deleteAllArticles();
        return "✅ All articles have been cleared from the database.";
    }
}
