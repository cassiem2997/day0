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
public class ReplyResponse {
    private Long replyId;
    private String body;
    
    // 작성자 정보
    private Long authorId;
    private String authorNickname;
    private String authorProfileImage;
    
    // 채택 관련
    private Boolean isAdopted;        // 이 답변이 채택되었는지
    private Instant adoptedAt;        // 채택된 시간
    
    private Instant createdAt;
}