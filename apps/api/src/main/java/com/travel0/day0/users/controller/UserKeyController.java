package com.travel0.day0.users.controller;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.users.service.UserKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@Tag(name = "[관리자] 사용자", description = "사용자 공통 API")
@RequiredArgsConstructor
public class UserKeyController {

    private final UserKeyService userKeyService;
    private final FinOpenApiProperties finOpenApiProperties;

    // 관리자만 호출
    @PostMapping("/{userId}/user-key:save-external")
    @Operation(summary = "user-key 발급", description = "회원가입 시 발급")
    public Map<String, String> saveUserKey(@PathVariable Long userId) {
        String apiKey = finOpenApiProperties.getApiKey();
        String userKey = userKeyService.saveUserKey(userId, apiKey);
        return Map.of("userKey", userKey);
    }

    // 관리자만 호출
    @GetMapping("/{userId}/user-key:search-external")
    @Operation(summary = "user-key 조회")
    public Map<String, String> searchUserKey(@PathVariable Long userId) {
        String apiKey = finOpenApiProperties.getApiKey();
        String userKey = userKeyService.searchUserKey(userId, apiKey);
        return Map.of("userKey", userKey);
    }
}

