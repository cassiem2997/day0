package com.travel0.day0.checklist.controller;

import com.travel0.day0.checklist.dto.MissingItemsResponse;
import com.travel0.day0.checklist.dto.PriorityReorderResponse;
import com.travel0.day0.checklist.dto.MissingItem;
import com.travel0.day0.checklist.service.AiRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI 추천 기능 REST API 컨트롤러
 * Python AI 서비스(simplified_main.py)와 연동
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiRecommendationService aiRecommendationService;

    /**
     * 체크리스트 누락 항목 AI 추천
     *
     * GET /api/ai/recommendations/missing-items/{userChecklistId}?userId={userId}
     */
    @CrossOrigin(origins = "*")
    @GetMapping("/recommendations/missing-items/{userChecklistId}")
    public ResponseEntity<MissingItemsResponse> getMissingItemRecommendations(
            @PathVariable Long userChecklistId,
            @RequestParam Long userId) {

        try {
            log.info("AI 누락 항목 추천 요청: userChecklistId={}, userId={}", userChecklistId, userId);

            MissingItemsResponse response = aiRecommendationService.recommendMissingItems(userChecklistId, userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("AI 누락 항목 추천 실패: userChecklistId={}, userId={}", userChecklistId, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 체크리스트 우선순위 재정렬 AI 추천
     *
     * GET /api/ai/recommendations/priority-reorder/{userChecklistId}?userId={userId}
     */
    @CrossOrigin(origins = "*")
    @GetMapping("/recommendations/priority-reorder/{userChecklistId}")
    public ResponseEntity<PriorityReorderResponse> getPriorityReorderRecommendations(
            @PathVariable Long userChecklistId,
            @RequestParam Long userId) {

        try {
            log.info("AI 우선순위 재정렬 추천 요청: userChecklistId={}, userId={}", userChecklistId, userId);

            PriorityReorderResponse response = aiRecommendationService.recommendPriorityReorder(userChecklistId, userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("AI 우선순위 재정렬 추천 실패: userChecklistId={}, userId={}", userChecklistId, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * AI 추천 항목을 체크리스트에 추가
     *
     * POST /api/ai/recommendations/apply/{userChecklistId}?userId={userId}
     */
    @CrossOrigin(origins = "*")
    @PostMapping("/recommendations/apply/{userChecklistId}")
    public ResponseEntity<Map<String, Object>> applyRecommendation(
            @PathVariable Long userChecklistId,
            @RequestParam Long userId,
            @RequestBody MissingItem missingItem) {

        try {
            log.info("AI 추천 항목 적용 요청: userChecklistId={}, userId={}, item={}",
                    userChecklistId, userId, missingItem.getItemTitle());

            var result = aiRecommendationService.addRecommendedItem(userChecklistId, userId, missingItem);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "AI 추천 항목이 체크리스트에 추가되었습니다.",
                    "addedItemId", result.getUciId()
            ));

        } catch (Exception e) {
            log.error("AI 추천 항목 적용 실패: userChecklistId={}, userId={}", userChecklistId, userId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "항목 추가 중 오류가 발생했습니다."));
        }
    }

    /**
     * AI 서비스 상태 확인
     *
     * GET /api/ai/health
     */
    @CrossOrigin(origins = "*")
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