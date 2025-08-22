package com.travel0.day0.users.controller;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.users.service.UserKeyService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserKeyController {

    private final UserKeyService userKeyService;
    private final FinOpenApiProperties finOpenApiProperties;

    // 관리자만 호출
    @PostMapping("/{userId}/user-key:save-external")
    @Operation(description = "user-key 발급")
    public Map<String, String> saveUserKey(@PathVariable Long userId) {
        String apiKey = finOpenApiProperties.getApiKey();
        String userKey = userKeyService.saveUserKey(userId, apiKey);
        return Map.of("userKey", userKey);
    }

    // 관리자만 호출
    @PostMapping("/{userId}/user-key:search-external")
    @Operation(description = "user-key 조회")
    public Map<String, String> searchUserKey(@PathVariable Long userId) {
        String apiKey = finOpenApiProperties.getApiKey();
        String userKey = userKeyService.searchUserKey(userId, apiKey);
        return Map.of("userKey", userKey);
    }
}

