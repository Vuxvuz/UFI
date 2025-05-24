package com.ufit.server.service;

import com.ufit.server.dto.response.PubMedDataDto;
import reactor.core.publisher.Mono;

public interface PubMedApiService {
    Mono<PubMedDataDto> fetchResearchData(String query);
}