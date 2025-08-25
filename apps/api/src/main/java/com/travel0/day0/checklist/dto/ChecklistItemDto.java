package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * 체크리스트 항목 (공통)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemDto {
    private String title;
    private String description;
    private String tag;
    private String status;

    @JsonProperty("is_fixed")
    private Boolean isFixed; // 날짜 고정 여부
}