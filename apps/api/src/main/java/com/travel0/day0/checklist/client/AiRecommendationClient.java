package com.travel0.day0.checklist.client;

import com.day0.backend.dto.ai.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

/**
 * FastAPI AI 추천 서비스 클라이언트
 *
 * 1. 누락 항목 추천: aiClient.getMissingItems(request)
 * 2. 우선순위 재정렬: aiClient.reorderPriority(request)
 */
@Slf4j
@Component
public class AiRecommendationClient {

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;
    
    @Value("${ai.service.timeout:10}")
    private int timeoutSeconds;
    
    private final RestTemplate restTemplate;
    
    public AiRecommendationClient() {
        this.restTemplate = new RestTemplate();
        // 타임아웃 설정
        this.restTemplate.getRequestFactory();
    }
    
    /**
     * 누락 항목 추천 API 호출
     * 
     * @param request 기존 체크리스트 항목들
     * @return 누락된 추천 항목들
     */
    public MissingItemsResponse getMissingItems(MissingItemsRequest request) {
        try {
            log.info("AI 누락 항목 추천 요청: country={}, program={}, items={}", 
                    request.getCountryCode(), request.getProgramTypeId(), request.getExistingItems().size());
            
            String url = aiServiceUrl + "/ai/recommendations/missing-items";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<MissingItemsRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<MissingItemsResponse> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                MissingItemsResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("AI 추천 성공: {}개 누락 항목 발견", response.getBody().getTotalMissing());
                return response.getBody();
            } else {
                log.warn("AI 서비스 응답 이상: status={}", response.getStatusCode());
                return createEmptyMissingItemsResponse();
            }
            
        } catch (RestClientException e) {
            log.error("AI 서비스 호출 실패 (누락 항목): {}", e.getMessage());
            return createEmptyMissingItemsResponse();
        } catch (Exception e) {
            log.error("AI 클라이언트 예상치 못한 오류", e);
            return createEmptyMissingItemsResponse();
        }
    }
    
    /**
     * 우선순위 재정렬 API 호출
     * 
     * @param request 현재 체크리스트 항목들
     * @return 재정렬된 우선순위
     */
    public PriorityReorderResponse reorderPriority(PriorityReorderRequest request) {
        try {
            log.info("AI 우선순위 재정렬 요청: country={}, program={}, items={}", 
                    request.getCountryCode(), request.getProgramTypeId(), request.getCurrentItems().size());
            
            String url = aiServiceUrl + "/ai/recommendations/priority-reorder";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<PriorityReorderRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<PriorityReorderResponse> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                entity, 
                PriorityReorderResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("AI 우선순위 재정렬 성공: {}개 항목", response.getBody().getTotalReordered());
                return response.getBody();
            } else {
                log.warn("AI 서비스 응답 이상: status={}", response.getStatusCode());
                return createEmptyPriorityResponse(request);
            }
            
        } catch (RestClientException e) {
            log.error("AI 서비스 호출 실패 (우선순위): {}", e.getMessage());
            return createEmptyPriorityResponse(request);
        } catch (Exception e) {
            log.error("AI 클라이언트 예상치 못한 오류", e);
            return createEmptyPriorityResponse(request);
        }
    }
    
    /**
     * AI 서비스 헬스체크
     * 
     * @return 서비스 상태
     */
    public boolean isAiServiceHealthy() {
        try {
            String url = aiServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.warn("AI 서비스 헬스체크 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * AI 서비스 캐시 상태 확인 (디버깅용)
     */
    public String getAiCacheStatus() {
        try {
            String url = aiServiceUrl + "/cache/status";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.warn("AI 캐시 상태 확인 실패: {}", e.getMessage());
            return "캐시 상태 확인 불가";
        }
    }
    
    // ========================================================================
    // 폴백 메서드들 (AI 서비스 장애 시 대비)
    // ========================================================================
    
    private MissingItemsResponse createEmptyMissingItemsResponse() {
        return MissingItemsResponse.builder()
                .missingItems(Collections.emptyList())
                .totalMissing(0)
                .recommendationSummary("🔧 AI 추천 서비스 일시 중단 중입니다.")
                .build();
    }
    
    private PriorityReorderResponse createEmptyPriorityResponse(PriorityReorderRequest request) {
        // 기존 순서 그대로 반환 (AI 추천 없이)
        List<PriorityItem> originalOrder = request.getCurrentItems().stream()
                .map(item -> PriorityItem.builder()
                        .title(item.getTitle())
                        .description(item.getDescription())
                        .tag(item.getTag())
                        .originalPriority(request.getCurrentItems().indexOf(item) + 1)
                        .aiPriority(request.getCurrentItems().indexOf(item) + 1)
                        .urgencyScore(0.5)
                        .reorderReason("📝 기본 순서 유지")
                        .isFixed(item.getIsFixed() != null ? item.getIsFixed() : false)
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