package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 우선순위 재정렬 요청
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityReorderRequest {
    @JsonProperty("current_items")
    private List<ChecklistItemDto> currentItems;

    @JsonProperty("country_code")
    private String countryCode;

    @JsonProperty("program_type_id")
    private Integer programTypeId;

    @JsonProperty("departure_date")
    private String departureDate;

    @JsonProperty("user_context")
    private Map<String, Object> userContext; // 선택적 사용자 컨텍스트
}
