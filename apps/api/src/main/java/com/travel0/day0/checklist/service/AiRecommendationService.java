package com.travel0.day0.checklist.service;

import com.travel0.day0.checklist.client.AiRecommendationClient;
import com.travel0.day0.checklist.dto.*;
import com.travel0.day0.checklist.domain.UserChecklistItem;
import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.departures.repository.DepartureInfoRepository;
import com.travel0.day0.common.enums.ChecklistTag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private final AiRecommendationClient aiClient;
    private final UserChecklistService userChecklistService;
    private final DepartureInfoRepository departureInfoRepository; // 추가된 의존성

    /**
     * 체크리스트 누락 항목 AI 추천 (실제 엔티티 사용)
     */
    public MissingItemsResponse recommendMissingItems(Long userChecklistId, Long userId) {
        try {
            // 1. 기존 체크리스트와 항목들 조회
            UserChecklistResponse userChecklist = userChecklistService.getUserChecklistById(userChecklistId, userId);
            List<UserChecklistItemResponse> items = userChecklistService.getAllUserChecklistItems(userChecklistId);

            // 2. Response → DTO 변환 (AI 서비스용)
            List<ChecklistItemDto> existingItems = items.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            // 3. 출국 정보 실제 조회
            DepartureInfo departureInfo = getDepartureInfo(userChecklist.getDepartureId());

            // 4. AI 요청 객체 생성 (실제 데이터 사용)
            MissingItemsRequest request = MissingItemsRequest.builder()
                    .existingItems(existingItems)
                    .countryCode(departureInfo.getCountryCode())
                    .programTypeId(getProgramTypeId(departureInfo))
                    .departureDate(formatDepartureDate(departureInfo.getStartDate()))
                    .build();

            log.info("AI 누락 항목 추천 요청: userChecklistId={}, items={}, country={}, programType={}, departureDate={}",
                    userChecklistId, existingItems.size(), request.getCountryCode(),
                    request.getProgramTypeId(), request.getDepartureDate());

            // 5. Python AI 서비스 호출
            MissingItemsResponse response = aiClient.getMissingItems(request);

            log.info("AI 누락 항목 추천 완료: missing_count={}", response.getTotalMissing());
            return response;

        } catch (Exception e) {
            log.error("AI 누락 항목 추천 처리 중 오류: userChecklistId={}", userChecklistId, e);
            throw new RuntimeException("AI 추천 서비스 오류", e);
        }
    }

    /**
     * 체크리스트 우선순위 재정렬 AI 추천 (실제 엔티티 사용)
     */
    public PriorityReorderResponse recommendPriorityReorder(Long userChecklistId, Long userId) {
        try {
            // 1. 기존 체크리스트와 항목들 조회
            UserChecklistResponse userChecklist = userChecklistService.getUserChecklistById(userChecklistId, userId);
            List<UserChecklistItemResponse> items = userChecklistService.getAllUserChecklistItems(userChecklistId);

            // 2. Response → DTO 변환
            List<ChecklistItemDto> currentItems = items.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            // 3. 출국 정보 실제 조회
            DepartureInfo departureInfo = getDepartureInfo(userChecklist.getDepartureId());

            // 4. AI 요청 객체 생성 (실제 데이터 사용)
            PriorityReorderRequest request = PriorityReorderRequest.builder()
                    .currentItems(currentItems)
                    .countryCode(departureInfo.getCountryCode())
                    .programTypeId(getProgramTypeId(departureInfo))
                    .departureDate(formatDepartureDate(departureInfo.getStartDate()))
                    .userContext(null) // 필요시 추가 컨텍스트
                    .build();

            log.info("AI 우선순위 재정렬 요청: userChecklistId={}, items={}, country={}, departureDate={}",
                    userChecklistId, currentItems.size(), request.getCountryCode(), request.getDepartureDate());

            // 5. Python AI 서비스 호출
            PriorityReorderResponse response = aiClient.reorderPriority(request);

            log.info("AI 우선순위 재정렬 완료: reordered_count={}", response.getTotalReordered());
            return response;

        } catch (Exception e) {
            log.error("AI 우선순위 재정렬 처리 중 오류: userChecklistId={}", userChecklistId, e);
            throw new RuntimeException("AI 추천 서비스 오류", e);
        }
    }

    /**
     * AI 추천 항목을 실제 체크리스트에 추가
     */
    public UserChecklistItemResponse addRecommendedItem(Long userChecklistId, Long userId, MissingItem missingItem) {
        try {
            // 출국 정보 조회하여 정확한 due_date 계산
            UserChecklistResponse userChecklist = userChecklistService.getUserChecklistById(userChecklistId, userId);
            DepartureInfo departureInfo = getDepartureInfo(userChecklist.getDepartureId());

            // due_date 계산: departure_date + avg_offset_days (offset이 음수인 경우 출국 전 준비)
            Instant dueDate = null;
            if (missingItem.getAvgOffsetDays() != null && departureInfo.getStartDate() != null) {
                // avgOffsetDays가 음수면 출국 전 준비 (예: D-30), 양수면 출국 후 (예: D+7)
                dueDate = departureInfo.getStartDate().plusSeconds(missingItem.getAvgOffsetDays() * 24 * 60 * 60L);
            }

            // 새 체크리스트 아이템 생성 요청
            CreateUserChecklistItemRequest itemRequest = CreateUserChecklistItemRequest.builder()
                    .title(missingItem.getItemTitle())
                    .dueDate(dueDate)
                    .tag(convertStringToTag(missingItem.getItemTag()))
                    .linkedAmount(null) // 필요시 AI에서 제공하는 amount 사용
                    .isFixed(false) // AI 추천 항목은 사용자가 편집 가능
                    .build();

            // 실제 서비스를 통해 아이템 추가
            UserChecklistItemResponse result = userChecklistService.createUserChecklistItem(
                    userChecklistId, userId, itemRequest);

            log.info("AI 추천 항목 추가 완료: userChecklistId={}, itemTitle={}, dueDate={}",
                    userChecklistId, missingItem.getItemTitle(), dueDate);

            return result;

        } catch (Exception e) {
            log.error("AI 추천 항목 추가 실패: userChecklistId={}, item={}",
                    userChecklistId, missingItem.getItemTitle(), e);
            throw new RuntimeException("추천 항목 추가 오류", e);
        }
    }

    /**
     * AI 서비스 상태 확인
     */
    public boolean isAiServiceAvailable() {
        return aiClient.isAiServiceHealthy();
    }

    public String getAiCacheStatus() {
        return aiClient.getAiCacheStatus();
    }

    // ========================================================================
    // Private Helper Methods (실제 구현 완성)
    // ========================================================================

    /**
     * UserChecklistItemResponse를 ChecklistItemDto로 변환
     */
    private ChecklistItemDto convertToDto(UserChecklistItemResponse item) {
        return ChecklistItemDto.builder()
                .title(item.getTitle())
                .description(item.getDescription())
                .tag(item.getTag() != null ? item.getTag().name() : "NONE")
                .status(item.getStatus() != null ? item.getStatus().name() : "TODO")
                .isFixed(item.getIsFixed() != null ? item.getIsFixed() : false)
                .build();
    }

    /**
     * DepartureInfo 실제 조회
     */
    private DepartureInfo getDepartureInfo(Long departureId) {
        return departureInfoRepository.findById(departureId)
                .orElseThrow(() -> new IllegalArgumentException("출국 정보를 찾을 수 없습니다: " + departureId));
    }

    /**
     * 프로그램 타입 ID 실제 추출
     */
    private Integer getProgramTypeId(DepartureInfo departureInfo) {
        if (departureInfo.getProgramType() != null) {
            // ProgramType 엔티티에서 ID 추출
            return Math.toIntExact(departureInfo.getProgramType().getProgramTypeId());
        }

        log.warn("ProgramType이 null입니다. 기본값 1(교환학생)로 설정합니다. departureId={}",
                departureInfo.getDepartureId());
        return 1; // 기본값: 교환학생
    }

    /**
     * 출국 날짜를 AI 서비스 형식으로 변환 (Instant → "YYYY-MM-DD")
     */
    private String formatDepartureDate(Instant startDate) {
        if (startDate == null) {
            log.warn("출국 날짜가 null입니다. 임시 날짜로 설정합니다.");
            return LocalDate.now().plusDays(60).format(DateTimeFormatter.ISO_LOCAL_DATE);
        }

        // Instant를 LocalDate로 변환 (시스템 기본 시간대 사용)
        LocalDate departureDate = startDate.atZone(ZoneId.systemDefault()).toLocalDate();
        return departureDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    /**
     * String을 ChecklistTag Enum으로 변환
     */
    private ChecklistTag convertStringToTag(String tagString) {
        if (tagString == null || tagString.trim().isEmpty()) {
            return ChecklistTag.NONE;
        }

        try {
            // Python AI에서 보내는 태그명을 Java enum에 매핑
            String normalizedTag = tagString.toUpperCase().trim();

            // 특별 매핑 케이스들
            switch (normalizedTag) {
                case "DOCUMENT": return ChecklistTag.DOCUMENT;
                case "INSURANCE": return ChecklistTag.INSURANCE;
                case "EXCHANGE": return ChecklistTag.EXCHANGE;
                case "SAVING": return ChecklistTag.SAVING;
                case "ETC": return ChecklistTag.ETC;
                case "NONE":
                default: return ChecklistTag.NONE;
            }

        } catch (Exception e) {
            log.warn("태그 변환 실패: {}, 기본값 NONE으로 설정", tagString, e);
            return ChecklistTag.NONE;
        }
    }
}