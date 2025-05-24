package com.ufit.server.service;

import com.ufit.server.dto.response.AggregatedDataDto;
import reactor.core.publisher.Mono;

public interface DataAggregationService {
    Mono<AggregatedDataDto> aggregateData(String query);
}