package com.ufit.server.service;


import com.ufit.server.dto.response.WHODataDto;
import reactor.core.publisher.Mono;

public interface WHOApiService {
    Mono<WHODataDto> fetchHealthData(String endpoint);
}