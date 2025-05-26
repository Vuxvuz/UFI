package com.ufit.server.service.impl;

import com.ufit.server.dto.response.AggregatedDataDto;
import com.ufit.server.dto.response.WHODataDto;
import com.ufit.server.service.DataAggregationService;
import com.ufit.server.service.WHOApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class DataAggregationServiceImpl implements DataAggregationService {

    @Autowired
    private WHOApiService whoApiService;

    @Override
    public Mono<AggregatedDataDto> aggregateData(String query) {
        Mono<WHODataDto> whoData = whoApiService.fetchHealthData("some-endpoint");

        return whoData.map(who -> new AggregatedDataDto(
                who.getId(),
                who.getTitle(),
                who.getDescription()
        ));
    }
}
