package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 누락 항목
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingItem {
    @JsonProperty("item_title")
    private String itemTitle;

    @JsonProperty("item_description")
    private String itemDescription;

    @JsonProperty("item_tag")
    private String itemTag;

    @JsonProperty("popularity_rate")
    private Double popularityRate;

    @JsonProperty("avg_offset_days")
    private Integer avgOffsetDays;

    @JsonProperty("priority_score")
    private Integer priorityScore;

    @JsonProperty("missing_reason")
    private String missingReason;

    @JsonProperty("confidence_score")
    private Double confidenceScore;
}
