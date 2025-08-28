package com.travel0.day0.users.dto;

import com.travel0.day0.common.enums.Gender;
import com.travel0.day0.users.domain.University;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    private Long userId;
    private String name;
    private String email;
    private String nickname;
    private Gender gender;
    private LocalDate birth;
    private String profileImage;
    private Long mileage;
    private String country;
    private String homeUniv;
    private String destUniv;
    private Instant departureDate;
}
