package com.ufit.server.service.impl;

import com.ufit.server.dto.response.NewsApiArticleDto;
import com.ufit.server.service.NewsApiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class NewsApiServiceImpl implements NewsApiService {

    private final String apiKey;
    private final String baseUrl;
    private final WebClient webClient;

    /**
     * Constructor Injection: Spring sẽ inject apiKey và baseUrl trước khi khởi tạo bean này.
     * Khi khởi tạo xong, ta build WebClient với baseUrl đã có sẵn.
     */
    public NewsApiServiceImpl(
            WebClient.Builder webClientBuilder,
            @Value("${newsapi.key}") String apiKey,
            @Value("${newsapi.baseurl}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.webClient = webClientBuilder.baseUrl(baseUrl).build();

        // Debug: kiểm tra Spring đã inject đúng hay chưa
        System.out.println(">>> NewsApiServiceImpl.constructor: apiKey = " + apiKey);
        System.out.println(">>> NewsApiServiceImpl.constructor: baseUrl = " + baseUrl);
    }

    /**
     * Lấy danh sách "latest health news" bằng cách gọi vào endpoint:
     *   GET {baseUrl}/top-headlines?category=health&language=en&pageSize=20&apiKey={apiKey}
     * 
     * NewsAPI sẽ trả về các bài vốn đã được gán nhãn "health" (y tế) tại nguồn.
     */
    @Override
    public List<NewsApiArticleDto> fetchLatestNews() {
        Map<String, Object> response = webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/top-headlines")
                .queryParam("category", "health")
                .queryParam("language", "en")
                .queryParam("pageSize", 20)   // Giới hạn 20 bài, có thể điều chỉnh tùy ý
                .queryParam("apiKey", apiKey)
                .build())
            .retrieve()
            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
            .block();

        if (response == null || !response.containsKey("articles")) {
            throw new RuntimeException("Failed to fetch health category top headlines from NewsAPI");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> articles = (List<Map<String, Object>>) response.get("articles");
        List<NewsApiArticleDto> result = new ArrayList<>();

        for (Map<String, Object> article : articles) {
            @SuppressWarnings("unchecked")
            Map<String, Object> source = (Map<String, Object>) article.get("source");

            result.add(new NewsApiArticleDto(
                    // Lấy title, description, url, urlToImage, publishedAt, và tên source
                    (String) article.get("title"),
                    (String) article.get("description"),
                    (String) article.get("url"),
                    (String) article.get("urlToImage"),
                    (String) article.get("publishedAt"),
                    source != null ? (String) source.get("name") : "Unknown"
            ));
        }

        return result;
    }

    /**
     * Nếu bạn cần một phương thức riêng để gọi "health news" (có thể là tương tự
     * fetchLatestNews hoặc gọi vào endpoint /everything với query nâng cao),
     * ở đây ta tạm thời để nó gọi chung vào fetchLatestNews() để tránh lặp code.
     */
    @Override
    public List<NewsApiArticleDto> fetchHealthNews() {
        return fetchLatestNews();
    }
}
