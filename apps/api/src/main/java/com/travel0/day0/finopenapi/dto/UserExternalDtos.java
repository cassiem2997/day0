package com.travel0.day0.finopenapi.dto;

import jakarta.validation.constraints.NotBlank;

public class UserExternalDtos {
    public record MemberReq(
            @NotBlank String apiKey,
            @NotBlank String userId
    ) {}

    public record MemberRes(
            String userId,
            String userName,
            String institutionCode,
            String userKey,
            String created,
            String modified
    ) {}
}
