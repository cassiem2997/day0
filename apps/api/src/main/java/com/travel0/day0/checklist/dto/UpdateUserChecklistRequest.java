package com.travel0.day0.checklist.dto;

import com.travel0.day0.common.enums.ChecklistVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateUserChecklistRequest {
    private String title;
    private ChecklistVisibility visibility;
}
