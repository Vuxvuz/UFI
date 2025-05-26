package com.ufit.server.service;

import com.ufit.server.dto.response.WHODataDto;
import reactor.core.publisher.Mono;

import java.util.List;

public interface WHOApiService {
    List<WHODataDto> fetchLatestNews();
    Mono<WHODataDto> fetchHealthData(String endpoint);
}
