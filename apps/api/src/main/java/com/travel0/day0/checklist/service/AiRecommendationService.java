package com.travel0.day0.checklist.service;

import com.day0.backend.client.AiRecommendationClient;
import com.day0.backend.dto.ai.*;
import com.day0.backend.entity.UserChecklistItem;
import com.day0.backend.entity.DepartureInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AI 추천 서비스
 * 
 * 체크리스트 항목들을 AI 분석해서:
 * 1. 누락된 항목 추천
 * 2. 우선순위 재정렬 추천
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationService {
    
    private final AiRecommendationClient aiClient;
    
    /**
     * 체크리스트 누락 항목 AI 추천
     * 
     * @param userChecklistItems 사용자의 현재 체크리스트 항목들
     * @param departureInfo 출국 정보
     * @return 누락된 추천 항목들
     */
    public MissingItemsResponse recommendMissingItems(
            List<UserChecklistItem> userChecklistItems, 
            DepartureInfo departureInfo) {
        
        try {
            // 1. 엔티티 → DTO 변환
            List<ChecklistItemDto> existingItems = userChecklistItems.stream()
                    .map(this::convertToChecklistItemDto)
                    .collect(Collectors.toList());
            
            // 2. AI 요청 객체 생성
            MissingItemsRequest request = MissingItemsRequest.builder()
                    .existingItems(existingItems)
                    .countryCode(departureInfo.getCountryCode())
                    .programTypeId(Math.toIntExact(departureInfo.getProgramType().getProgramTypeId()))
                    .departureDate(departureInfo.getStartDate().format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .build();
            
            // 3. AI 서비스 호출
            log.info("AI 누락 항목 추천 요청: user_checklist_items={}, country={}", 
                    existingItems.size(), departureInfo.getCountryCode());
            
            MissingItemsResponse response = aiClient.getMissingItems(request);
            
            log.info("AI 누락 항목 추천 완료: missing_count={}", response.getTotalMissing());
            
            return response;
            
        } catch (Exception e) {
            log.error("AI 누락 항목 추천 처리 중 오류", e);
            throw new RuntimeException("AI 추천 서비스 오류", e);
        }
    }
    
    /**
     * 체크리스트 우선순위 재정렬 AI 추천
     * 
     * @param userChecklistItems 사용자의 현재 체크리스트 항목들
     * @param departureInfo 출국 정보
     * @return 재정렬된 우선순위 추천
     */
    public PriorityReorderResponse recommendPriorityReorder(
            List<UserChecklistItem> userChecklistItems, 
            DepartureInfo departureInfo) {
        
        try {
            // 1. 엔티티 → DTO 변환
            List<ChecklistItemDto> currentItems = userChecklistItems.stream()
                    .map(this::convertToChecklistItemDto)
                    .collect(Collectors.toList());
            
            // 2. AI 요청 객체 생성
            PriorityReorderRequest request = PriorityReorderRequest.builder()
                    .currentItems(currentItems)
                    .countryCode(departureInfo.getCountryCode())
                    .programTypeId(Math.toIntExact(departureInfo.getProgramType().getProgramTypeId()))
                    .departureDate(departureInfo.getStartDate().format(DateTimeFormatter.ISO_LOCAL_DATE))
                    .userContext(null) // 필요시 사용자 컨텍스트 추가
                    .build();
            
            // 3. AI 서비스 호출
            log.info("AI 우선순위 재정렬 요청: user_checklist_items={}, country={}", 
                    currentItems.size(), departureInfo.getCountryCode());
            
            PriorityReorderResponse response = aiClient.reorderPriority(request);
            
            log.info("AI 우선순위 재정렬 완료: reordered_count={}", response.getTotalReordered());
            
            return response;
            
        } catch (Exception e) {
            log.error("AI 우선순위 재정렬 처리 중 오류", e);
            throw new RuntimeException("AI 추천 서비스 오류", e);
        }
    }
    
    /**
     * AI 서비스 상태 확인
     * 
     * @return AI 서비스 정상 여부
     */
    public boolean isAiServiceAvailable() {
        return aiClient.isAiServiceHealthy();
    }
    
    /**
     * AI 캐시 상태 조회 (관리자용)
     * 
     * @return 캐시 상태 정보
     */
    public String getAiCacheStatus() {
        return aiClient.getAiCacheStatus();
    }
    
    // ========================================================================
    // Private Helper Methods
    // ========================================================================
    
    /**
     * UserChecklistItem 엔티티를 ChecklistItemDto로 변환
     */
    private ChecklistItemDto convertToChecklistItemDto(UserChecklistItem item) {
        return ChecklistItemDto.builder()
                .title(item.getTitle())
                .description(item.getDescription())
                .tag(item.getTag().name()) // Enum → String
                .status(item.getStatus().name()) // Enum → String
                .isFixed(item.getIsFixed()) // Boolean 그대로
                .build();
    }
    
    /**
     * AI 추천 항목을 체크리스트 항목으로 변환 (필요시 사용)
     */
    public UserChecklistItem convertMissingItemToEntity(
            MissingItem missingItem, 
            Long userChecklistId,
            DepartureInfo departureInfo) {
        
        // due_date 계산: departure_date + avg_offset_days
        var dueDate = departureInfo.getStartDate().plusDays(missingItem.getAvgOffsetDays());
        
        return UserChecklistItem.builder()
                .userChecklistId(userChecklistId)
                .title(missingItem.getItemTitle())
                .description(missingItem.getItemDescription())
                .dueDate(dueDate.atStartOfDay()) // LocalDateTime으로 변환
                .tag(UserChecklistItem.Tag.valueOf(missingItem.getItemTag()))
                .status(UserChecklistItem.Status.TODO)
                .linkedAmount(null) // 필요시 설정
                .isFixed(false) // AI 추천 항목은 고정되지 않음
                .build();
    }
}