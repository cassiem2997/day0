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
public class PostResponse {
    private Long postId;
    private String title;
    private String body;
    private String countryCode;
    private String category;
    
    // 작성자 정보
    private Long authorId;
    private String authorNickname;
    private String authorProfileImage;
    
    // 대학 정보
    private Long universityId;
    private String universityName;
    
    // 통계
    private Long likeCount;
    private Long replyCount;
    private Boolean isLikedByCurrentUser;
    
    // Q&A 관련
    private Boolean hasAdoptedReply;      // 채택된 답변이 있는지 (질문글인 경우)
    private Long adoptedReplyId;          // 채택된 답변 ID
    
    // 시간
    private Instant createdAt;
    private Instant updatedAt;
}