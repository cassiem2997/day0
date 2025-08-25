package com.travel0.day0.community.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSummaryResponse {
    private Long postId;
    private String title;
    private String category;
    private String countryCode;
    
    // 작성자 정보 (요약)
    private String authorNickname;
    
    // 통계
    private Long likeCount;
    private Long replyCount;
    
    private Instant createdAt;
    
    // 미리보기
    @JsonProperty("bodyPreview")
    public String getBodyPreview() {
        // 실제 구현에서는 Service에서 처리
        return null;
    }
}
