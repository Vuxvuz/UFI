package com.ufit.server.service.Impl;

import com.ufit.server.dto.response.PubMedDataDto;
import com.ufit.server.service.impl.PubMedApiServiceImpl;
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
import static org.mockito.ArgumentMatchers.any;
import java.util.function.Function;
import org.springframework.web.util.UriBuilder;



import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PubMedApiServiceImplTest {

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

    private PubMedApiServiceImpl pubMedApiService;

    @BeforeEach
@SuppressWarnings("unchecked")
void setUp() {
    MockitoAnnotations.openMocks(this);
    when(webClientBuilder.baseUrl(anyString())).thenReturn(webClientBuilder);
    when(webClientBuilder.build()).thenReturn(webClient);
    when(webClient.get()).thenReturn(requestHeadersUriSpec);
    when(requestHeadersUriSpec.uri(any(Function.class))).thenReturn(requestHeadersSpec);
    when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);

    pubMedApiService = new PubMedApiServiceImpl(webClientBuilder);
}

    @Test
    void testFetchResearchData() {
        // Arrange
        String query = "cancer";
        PubMedDataDto mockData = new PubMedDataDto(List.of("12345"));

        when(responseSpec.bodyToMono(PubMedDataDto.class)).thenReturn(Mono.just(mockData));

        // Act
        Mono<PubMedDataDto> result = pubMedApiService.fetchResearchData(query);

        // Assert
        StepVerifier.create(result)
                .expectNextMatches(dto -> dto.idList().contains("12345"))
                .verifyComplete();
    }
}