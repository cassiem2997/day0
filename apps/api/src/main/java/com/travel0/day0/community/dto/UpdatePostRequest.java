package com.travel0.day0.community.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePostRequest {
    @Size(max = 200, message = "제목은 200자 이하여야 합니다")
    private String title;

    @Size(max = 10000, message = "내용은 10000자 이하여야 합니다")
    private String body;

    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다")
    private String category;
}
