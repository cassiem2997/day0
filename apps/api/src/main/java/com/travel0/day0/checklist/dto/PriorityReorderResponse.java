package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 우선순위 재정렬 응답
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityReorderResponse {
    @JsonProperty("reordered_items")
    private List<PriorityItem> reorderedItems;

    @JsonProperty("total_reordered")
    private Integer totalReordered;

    @JsonProperty("days_until_departure")
    private Integer daysUntilDeparture;

    @JsonProperty("reorder_summary")
    private String reorderSummary;
}