package com.ufit.server.service.impl;

import com.ufit.server.dto.response.PubMedDataDto;
import com.ufit.server.service.PubMedApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class PubMedApiServiceImpl implements PubMedApiService {

    private final WebClient webClient;

    @Autowired
    public PubMedApiServiceImpl(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl("https://eutils.ncbi.nlm.nih.gov/entrez/eutils").build();
    }

    @Override
    public Mono<PubMedDataDto> fetchResearchData(String query) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/esearch.fcgi")
                        .queryParam("db", "pubmed")
                        .queryParam("term", query)
                        .queryParam("retmode", "json")
                        .build())
                .retrieve()
                .bodyToMono(PubMedDataDto.class);
    }
}