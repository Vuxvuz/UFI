package com.ufit.server.service.Impl;

import com.ufit.server.dto.response.WHODataDto;
import com.ufit.server.service.impl.WHOApiServiceImpl;
import com.ufit.server.service.WHOApiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;


import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WHOApiServiceImplTest {

    @Mock
    private WebClient.Builder webClientBuilder;

    @Mock
    private WebClient webClient;

    @SuppressWarnings("unchecked")
    @Mock
    private WebClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @SuppressWarnings("unchecked")  
    @Mock
    private WebClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private WHOApiServiceImpl whoApiService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
    when(webClientBuilder.baseUrl(anyString())).thenReturn(webClientBuilder);
    when(webClientBuilder.build()).thenReturn(webClient);
    when(webClient.get()).thenReturn(requestHeadersUriSpec);
    when(requestHeadersUriSpec.uri(anyString())).thenReturn(requestHeadersSpec);
    when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);

    whoApiService = new WHOApiServiceImpl(webClientBuilder);
}

    @Test
    void testFetchHealthData() {
        // Arrange
        String endpoint = "/gho/indicator";
        WHODataDto mockData = new WHODataDto("1", "Test Title", "Test Description");

        when(responseSpec.bodyToMono(WHODataDto.class)).thenReturn(Mono.just(mockData));

        // Act
        Mono<WHODataDto> result = whoApiService.fetchHealthData(endpoint);

        // Assert
        StepVerifier.create(result)
                .expectNextMatches(dto ->
                        dto.id().equals("1") &&
                        dto.title().equals("Test Title") &&
                        dto.description().equals("Test Description"))
                .verifyComplete();
    }
}
