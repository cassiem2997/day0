package com.travel0.day0.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {
    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    @Size(max = 10000, message = "내용은 10000자 이하여야 합니다")
    private String body;

    private String countryCode;     // 선택적
    private Long universityId;      // 선택적
    
    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다")
    private String category;        // TIPS, QNA, REVIEW, GENERAL 등
    // 카테고리 enum으로 바꿔야 함 
}