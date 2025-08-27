package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 우선순위 조정된 항목
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityItem {
    private String title;
    private String description;
    private String tag;

    @JsonProperty("original_priority")
    private Integer originalPriority;

    @JsonProperty("ai_priority")
    private Integer aiPriority;

    @JsonProperty("urgency_score")
    private Double urgencyScore;

    @JsonProperty("reorder_reason")
    private String reorderReason;

    @JsonProperty("is_fixed")
    private Boolean isFixed;
}
