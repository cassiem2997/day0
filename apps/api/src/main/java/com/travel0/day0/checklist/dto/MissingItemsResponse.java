package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 누락 항목 추천 응답
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingItemsResponse {
    @JsonProperty("missing_items")
    private List<MissingItem> missingItems;

    @JsonProperty("total_missing")
    private Integer totalMissing;

    @JsonProperty("recommendation_summary")
    private String recommendationSummary;
}