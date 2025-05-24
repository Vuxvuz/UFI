package com.ufit.server.service.impl;

import com.ufit.server.dto.response.WHODataDto;
import com.ufit.server.service.WHOApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class WHOApiServiceImpl implements WHOApiService {

    private final WebClient webClient;

    @Autowired
    public WHOApiServiceImpl(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://ghoapi.azureedge.net/api/").build();
    }

    @Override
    public Mono<WHODataDto> fetchHealthData(String endpoint) {
        return webClient.get()
                .uri(endpoint)
                .retrieve()
                .bodyToMono(WHODataDto.class);
    }
}