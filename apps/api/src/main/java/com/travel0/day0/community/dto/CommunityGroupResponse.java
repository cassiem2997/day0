package com.travel0.day0.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityGroupResponse {
    private String groupKey;           // "US_10" (국가_대학ID)
    private String groupName;          // "미국 한양대학교"
    private String countryCode;
    private String countryName;        // "미국"
    
    private Long universityId;
    private String universityName;     // "한양대학교"
    
    private Long memberCount;          // 해당 그룹 멤버 수
    private Long postCount;            // 해당 그룹 게시글 수
}