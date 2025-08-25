package com.travel0.day0.checklist.client;

import com.travel0.day0.checklist.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AiRecommendationClient {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Value("${ai.service.timeout:10}") // seconds
    private int timeoutSeconds;

    private final RestTemplate restTemplate;

    public AiRecommendationClient() {
        // 타임아웃 실제 적용
        var factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutSeconds * 1000);
        factory.setReadTimeout(timeoutSeconds * 1000);
        this.restTemplate = new RestTemplate(factory);
    }

    public MissingItemsResponse getMissingItems(MissingItemsRequest request) {
        final String url = aiServiceUrl + "/ai/recommendations/missing-items";
        try {
            log.info("[AI] missing-items ▶ POST {} (country={}, program={}, items={})",
                    url, request.getCountryCode(), request.getProgramTypeId(),
                    request.getExistingItems() == null ? 0 : request.getExistingItems().size());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            HttpEntity<MissingItemsRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<MissingItemsResponse> resp = restTemplate.exchange(
                    url, HttpMethod.POST, entity, MissingItemsResponse.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                log.info("[AI] missing-items ✔ totalMissing={}", resp.getBody().getTotalMissing());
                return resp.getBody();
            }
            log.warn("[AI] missing-items ◀ non-OK status={}", resp.getStatusCode());
            return createEmptyMissingItemsResponse();
        } catch (RestClientException e) {
            log.error("[AI] missing-items ✖ RestClientException: {}", e.getMessage());
            return createEmptyMissingItemsResponse();
        } catch (Exception e) {
            log.error("[AI] missing-items ✖ Unexpected", e);
            return createEmptyMissingItemsResponse();
        }
    }

    public PriorityReorderResponse reorderPriority(PriorityReorderRequest request) {
        final String url = aiServiceUrl + "/ai/recommendations/priority-reorder";
        try {
            log.info("[AI] priority-reorder ▶ POST {} (country={}, program={}, items={})",
                    url, request.getCountryCode(), request.getProgramTypeId(),
                    request.getCurrentItems() == null ? 0 : request.getCurrentItems().size());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

            HttpEntity<PriorityReorderRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<PriorityReorderResponse> resp = restTemplate.exchange(
                    url, HttpMethod.POST, entity, PriorityReorderResponse.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                log.info("[AI] priority-reorder ✔ totalReordered={}", resp.getBody().getTotalReordered());
                return resp.getBody();
            }
            log.warn("[AI] priority-reorder ◀ non-OK status={}", resp.getStatusCode());
            return createEmptyPriorityResponse(request);
        } catch (RestClientException e) {
            log.error("[AI] priority-reorder ✖ RestClientException: {}", e.getMessage());
            return createEmptyPriorityResponse(request);
        } catch (Exception e) {
            log.error("[AI] priority-reorder ✖ Unexpected", e);
            return createEmptyPriorityResponse(request);
        }
    }

    public boolean isAiServiceHealthy() {
        try {
            // ✅ main.py 기준으로 수정
            String url = aiServiceUrl + "/health";
            ResponseEntity<Map> resp = restTemplate.getForEntity(url, Map.class);
            boolean ok = resp.getStatusCode().is2xxSuccessful();
            log.info("[AI] health ◀ status={} body={}", resp.getStatusCode(), resp.getBody());
            return ok;
        } catch (Exception e) {
            log.warn("[AI] health ✖ {}", e.getMessage());
            return false;
        }
    }

    public String getAiCacheStatus() {
        try {
            String url = aiServiceUrl + "/cache/status";
            ResponseEntity<String> resp = restTemplate.getForEntity(url, String.class);
            log.info("[AI] cache-status ◀ status={} body={}", resp.getStatusCode(), resp.getBody());
            return resp.getBody();
        } catch (Exception e) {
            log.warn("[AI] cache-status ✖ {}", e.getMessage());
            return "캐시 상태 확인 불가";
        }
    }

    private MissingItemsResponse createEmptyMissingItemsResponse() {
        return MissingItemsResponse.builder()
                .missingItems(Collections.emptyList())
                .totalMissing(0)
                .recommendationSummary("🔧 AI 추천 서비스 일시 중단 중입니다.")
                .build();
    }

    private PriorityReorderResponse createEmptyPriorityResponse(PriorityReorderRequest request) {
        List<PriorityItem> originalOrder = request.getCurrentItems().stream()
                .map(item -> PriorityItem.builder()
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .tag(item.getTag())
                        .originalPriority(request.getCurrentItems().indexOf(item) + 1)
                        .aiPriority(request.getCurrentItems().indexOf(item) + 1)
                        .urgencyScore(0.5)
                        .reorderReason("📝 기본 순서 유지")
                        .isFixed(Boolean.TRUE.equals(item.getIsFixed()))
                        .build())
                .toList();

        return PriorityReorderResponse.builder()
                .reorderedItems(originalOrder)
                .totalReordered(originalOrder.size())
                .daysUntilDeparture(0)
                .reorderSummary("🔧 AI 추천 서비스 일시 중단 중입니다.")
                .build();
    }
}
