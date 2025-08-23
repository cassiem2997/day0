package com.travel0.day0.checklist.controller;

import com.day0.backend.dto.ai.MissingItemsResponse;
import com.day0.backend.dto.ai.PriorityReorderResponse;
import com.day0.backend.service.AiRecommendationService;
import com.day0.backend.service.UserChecklistService;
import com.day0.backend.service.DepartureInfoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI 추천 기능 REST API 컨트롤러
 * 
 * 프론트엔드에서 호출하는 AI 추천 엔드포인트들
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {
    
    private final AiRecommendationService aiRecommendationService;
    private final UserChecklistService userChecklistService;
    private final DepartureInfoService departureInfoService;
    
    /**
     * 체크리스트 누락 항목 AI 추천
     * 
     * GET /api/ai/recommendations/missing-items/{userChecklistId}
     * 
     * @param userChecklistId 사용자 체크리스트 ID
     * @return 누락된 추천 항목들
     */
    @GetMapping("/recommendations/missing-items/{userChecklistId}")
    public ResponseEntity<MissingItemsResponse> getMissingItemRecommendations(
            @PathVariable Long userChecklistId) {
        
        try {
            log.info("AI 누락 항목 추천 요청: userChecklistId={}", userChecklistId);
            
            // 1. 사용자 체크리스트 조회
            var userChecklist = userChecklistService.findById(userChecklistId);
            var userChecklistItems = userChecklistService.getChecklistItems(userChecklistId);
            var departureInfo = departureInfoService.findById(userChecklist.getDepartureId());
            
            // 2. AI 추천 서비스 호출
            MissingItemsResponse response = aiRecommendationService.recommendMissingItems(
                    userChecklistItems, departureInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("AI 누락 항목 추천 실패: userChecklistId={}", userChecklistId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * 체크리스트 우선순위 재정렬 AI 추천
     * 
     * GET /api/ai/recommendations/priority-reorder/{userChecklistId}
     * 
     * @param userChecklistId 사용자 체크리스트 ID
     * @return 재정렬된 우선순위 추천
     */
    @GetMapping("/recommendations/priority-reorder/{userChecklistId}")
    public ResponseEntity<PriorityReorderResponse> getPriorityReorderRecommendations(
            @PathVariable Long userChecklistId) {
        
        try {
            log.info("AI 우선순위 재정렬 추천 요청: userChecklistId={}", userChecklistId);
            
            // 1. 사용자 체크리스트 조회
            var userChecklist = userChecklistService.findById(userChecklistId);
            var userChecklistItems = userChecklistService.getChecklistItems(userChecklistId);
            var departureInfo = departureInfoService.findById(userChecklist.getDepartureId());
            
            // 2. AI 추천 서비스 호출
            PriorityReorderResponse response = aiRecommendationService.recommendPriorityReorder(
                    userChecklistItems, departureInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("AI 우선순위 재정렬 추천 실패: userChecklistId={}", userChecklistId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * AI 추천 항목을 체크리스트에 추가
     * 
     * POST /api/ai/recommendations/apply/{userChecklistId}
     * 
     * @param userChecklistId 사용자 체크리스트 ID
     * @param requestBody 추가할 항목 정보
     * @return 추가 결과
     */
    @PostMapping("/recommendations/apply/{userChecklistId}")
    public ResponseEntity<Map<String, Object>> applyRecommendation(
            @PathVariable Long userChecklistId,
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            log.info("AI 추천 항목 적용 요청: userChecklistId={}", userChecklistId);
            
            String itemTitle = (String) requestBody.get("itemTitle");
            String itemDescription = (String) requestBody.get("itemDescription");
            String itemTag = (String) requestBody.get("itemTag");
            Integer offsetDays = (Integer) requestBody.get("offsetDays");
            
            // 체크리스트에 새 항목 추가
            var result = userChecklistService.addRecommendedItem(
                    userChecklistId, itemTitle, itemDescription, itemTag, offsetDays);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "AI 추천 항목이 체크리스트에 추가되었습니다.",
                    "addedItemId", result.getUciId()
            ));
            
        } catch (Exception e) {
            log.error("AI 추천 항목 적용 실패: userChecklistId={}", userChecklistId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "항목 추가 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * AI 서비스 상태 확인 (관리자용)
     * 
     * GET /api/ai/health
     * 
     * @return AI 서비스 상태
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getAiServiceHealth() {
        try {
            boolean isHealthy = aiRecommendationService.isAiServiceAvailable();
            String cacheStatus = aiRecommendationService.getAiCacheStatus();
            
            return ResponseEntity.ok(Map.of(
                    "aiServiceHealthy", isHealthy,
                    "cacheStatus", cacheStatus,
                    "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("AI 서비스 상태 확인 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "AI 서비스 상태 확인 불가"));
        }
    }
}