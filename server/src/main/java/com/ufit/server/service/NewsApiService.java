package com.ufit.server.service;

import com.ufit.server.dto.response.NewsApiArticleDto;
import java.util.List;

public interface NewsApiService {
    List<NewsApiArticleDto> fetchHealthNews();

    List<NewsApiArticleDto> fetchLatestNews();
}
