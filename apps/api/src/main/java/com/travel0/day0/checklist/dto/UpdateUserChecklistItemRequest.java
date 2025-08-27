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
public class UpdateUserChecklistItemRequest {
    private String title;
    private String description;
    private Instant dueDate;
    private ChecklistItemStatus status;
    private ChecklistTag tag;
    private BigDecimal linkedAmount;
    private Boolean isFixed;
}
