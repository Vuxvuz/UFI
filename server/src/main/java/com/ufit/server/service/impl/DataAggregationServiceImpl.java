package com.ufit.server.service.impl;

import com.ufit.server.dto.response.AggregatedDataDto;
import com.ufit.server.dto.response.PubMedDataDto;
import com.ufit.server.dto.response.WHODataDto;
import com.ufit.server.service.DataAggregationService;
import com.ufit.server.service.PubMedApiService;
import com.ufit.server.service.WHOApiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class DataAggregationServiceImpl implements DataAggregationService {

    @Autowired
    private WHOApiService whoApiService;

    @Autowired
    private PubMedApiService pubMedApiService;

    @Override
    public Mono<AggregatedDataDto> aggregateData(String query) {
        // Thay thế "some-endpoint" bằng endpoint thực tế của WHO
        Mono<WHODataDto> whoData = whoApiService.fetchHealthData("some-endpoint");
        Mono<PubMedDataDto> pubMedData = pubMedApiService.fetchResearchData(query);

        return Mono.zip(whoData, pubMedData)
                .map(tuple -> {
                    WHODataDto who = tuple.getT1();
                    PubMedDataDto pubMed = tuple.getT2();
                    // Tạo AggregatedDataDto từ dữ liệu WHO và PubMed
                    return new AggregatedDataDto(
                            "some-id", // Thay thế "some-id" bằng ID thực tế nếu cần
                            who.title() + " & " + pubMed.idList().toString(),
                            who.description()
                    );
                });
    }
}