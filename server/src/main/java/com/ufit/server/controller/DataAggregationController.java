package com.ufit.server.controller;

import com.ufit.server.dto.response.AggregatedDataDto;
import com.ufit.server.service.DataAggregationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/data")
public class DataAggregationController {

    @Autowired
    private DataAggregationService dataAggregationService;

    @GetMapping("/aggregate")
    public Mono<ResponseEntity<AggregatedDataDto>> aggregateData(@RequestParam String query) {
        return dataAggregationService.aggregateData(query)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> Mono.just(ResponseEntity.badRequest().build()));
    }
}