package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.math.BigDecimal;

import com.travel0.day0.common.enums.ChecklistTag;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicChecklistItemResponse {
    private Long uciId;
    private String title;
    private String description;
    private ChecklistTag tag;
    private Instant dueDate;
    private BigDecimal linkedAmount;
}