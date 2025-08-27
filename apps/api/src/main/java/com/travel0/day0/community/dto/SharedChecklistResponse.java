package com.travel0.day0.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedChecklistResponse {
    private Long userChecklistId;
    private String title;
    private String description;
    
    // 공유자 정보
    private String sharerNickname;
    private String sharerProfileImage;
    
    // 목적지 정보
    private String countryCode;
    private String countryName;
    private String universityName;
    private String programTypeName;
    
    // 통계
    private Integer totalItems;
    private Integer completedItems;
    private Double completionRate;
    private Long likeCount;
    private Long scrapCount;           // 스크랩한 사람 수
    
    // 메타데이터
    private Instant departureDate;     // 출국일
    private Instant createdAt;
    private Boolean isScrapedByCurrentUser;
}
