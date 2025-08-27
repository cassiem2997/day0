package com.travel0.day0.checklist.dto;

import com.travel0.day0.common.enums.ChecklistVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserChecklistResponse {
    private Long userChecklistId;
    private Long userId;
    private Long departureId;
    private Long templateId;
    private String title;
    private ChecklistVisibility visibility;
    private Instant createdAt;
    private List<UserChecklistItemResponse> items;
    private BigDecimal amount;
}
