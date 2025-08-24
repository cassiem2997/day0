package com.travel0.day0.checklist.dto;

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
public class CreateUserChecklistItemRequest {
    private String title;
    private Instant dueDate;
    private ChecklistTag tag;
    private BigDecimal linkedAmount;
    private Boolean isFixed = false;
}
