package com.travel0.day0.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private String email;
    private Long userId;

    public AuthResponse(String message){
        this.message = message;
    }
}
