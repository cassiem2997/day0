package com.travel0.day0.checklist.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicChecklistResponse {
    private Long userChecklistId;
    private String title;
    private String authorNickname;
    private String authorProfileImage;
    private String countryCode;
    private String countryName;
    private String universityName;
    private String programTypeName;
    private Integer totalItems;
    private Integer completedItems;
    private Double completionRate;
    private Long totalCollects; // 가져오기 횟수
    private Instant departureDate;
    private Instant createdAt;
}