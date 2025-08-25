package com.travel0.day0.checklist.dto;

import com.travel0.day0.common.enums.ChecklistItemStatus;
import com.travel0.day0.common.enums.ChecklistTag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserChecklistItemResponse {
    private Long uciId;
    private Long userChecklistId;
    private Long templateItemId;
    private String title;
    private String description;
    private Instant dueDate;
    private ChecklistItemStatus status;
    private Instant completedAt;
    private ChecklistTag tag;
    private BigDecimal linkedAmount;
    private Boolean isFixed;
    private Instant createdAt;
}
