package com.travel0.day0.auth.dto;

import com.travel0.day0.common.enums.Gender;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String nickname;
    private Gender gender;
    private LocalDate birth;
    private Long homeUniversityId;
}
