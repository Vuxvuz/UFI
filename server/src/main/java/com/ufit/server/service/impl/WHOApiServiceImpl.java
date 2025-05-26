package com.ufit.server.service.impl;

import com.ufit.server.dto.response.WHODataDto;
import com.ufit.server.service.WHOApiService;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
public class WHOApiServiceImpl implements WHOApiService {

    private static final String WHO_NEWS_URL = "https://www.who.int/news-room/releases";

    @Override
    public List<WHODataDto> fetchLatestNews() {
        List<WHODataDto> result = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(WHO_NEWS_URL)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
                    .get();

            // Selector bắt cả vertical + horizontal items
            Elements articles = doc.select(".list-view--item.vertical-list-item, .list-view--item.horizontal-list-item");

            System.out.println("Found articles: " + articles.size());  // Debug

            for (Element article : articles) {
                String title = article.select(".heading").text();
                String link = "https://www.who.int" + article.select("a").attr("href");
                String date = article.select(".timestamp").text();

                System.out.println("Fetched: " + title + " | " + link + " | " + date);  // Debug

                WHODataDto item = new WHODataDto(
                        link,  // dùng link làm id
                        title,
                        "",
                        date,
                        link
                );
                result.add(item);
            }
            return result;

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to crawl WHO news: " + e.getMessage());
        }
    }

    @Override
    public Mono<WHODataDto> fetchHealthData(String endpoint) {
        throw new UnsupportedOperationException("This method is not implemented.");
    }
}
