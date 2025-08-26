package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicChecklistDetailResponse {
    private PublicChecklistResponse checklist;
    private List<PublicChecklistItemResponse> items;
}