package com.travel0.day0.checklist.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 누락 항목 추천 요청
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingItemsRequest {
    @JsonProperty("existing_items")
    private List<ChecklistItemDto> existingItems;

    @JsonProperty("country_code")
    private String countryCode;

    @JsonProperty("program_type_id")
    private Integer programTypeId;

    @JsonProperty("departure_date")
    private String departureDate; // "2025-03-15" 형식
}