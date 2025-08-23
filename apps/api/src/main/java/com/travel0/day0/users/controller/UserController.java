package com.travel0.day0.users.controller;

import com.travel0.day0.users.dto.ProfileResponse;
import com.travel0.day0.users.dto.ProfileUpdateRequest;
import com.travel0.day0.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
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
    public ResponseEntity<ProfileResponse> getProfile(@RequestParam Long userId){
        ProfileResponse response = userService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/profile")
    @Operation(summary = "사용자 프로필 수정", description = "프로필 사진 삭제할 때는 deleteProfileImage를 true로 설정해주세용")
    public ResponseEntity<ProfileResponse> getProfile(
            @RequestParam Long userId,
            @RequestPart("user") ProfileUpdateRequest request,
            @RequestPart(value =  "profileImage", required = false) MultipartFile profileImage){
        ProfileResponse response = userService.updateProfile(userId, request, profileImage);
        return ResponseEntity.ok(response);
    }
}
