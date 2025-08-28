package com.travel0.day0.users.controller;

import com.travel0.day0.users.dto.ProfileResponse;
import com.travel0.day0.users.dto.ProfileUpdateRequest;
import com.travel0.day0.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "사용자 프로필 조회")
    public ResponseEntity<ProfileResponse> getProfile(@RequestParam Long userId) {
        ProfileResponse response = userService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/profile")
    @Operation(
            summary = "사용자 프로필 수정",
            description = "프로필 사진 삭제할 때는 deleteProfileImage를 true로 설정해주세용",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = ProfileUpdateMultipartDoc.class),
                            encoding = {
                                    @Encoding(name = "user", contentType = MediaType.APPLICATION_JSON_VALUE)
                            }
                    )
            )
    )
    public ResponseEntity<ProfileResponse> updateProfile(
            @RequestParam Long userId,
            @RequestPart("user") ProfileUpdateRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        ProfileResponse response = userService.updateProfile(userId, request, profileImage);
        return ResponseEntity.ok(response);
    }

    /**
     * 문서용 스키마: Swagger UI 표시 용
     */
    class ProfileUpdateMultipartDoc {
        @Schema(description = "프로필 수정 본문(JSON 객체)", implementation = ProfileUpdateRequest.class)
        public ProfileUpdateRequest user;

        @Schema(description = "프로필 이미지 파일", type = "string", format = "binary")
        public MultipartFile profileImage;
    }
}
