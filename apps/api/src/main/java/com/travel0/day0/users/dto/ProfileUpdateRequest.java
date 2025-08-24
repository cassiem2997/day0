package com.travel0.day0.users.dto;

import com.travel0.day0.common.enums.Gender;
import com.travel0.day0.users.domain.University;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileUpdateRequest {
    private String name;
    private String nickname;
    private Gender gender;
    private LocalDate birth;
    private String profileImage;
    private Long homeUnivId;
    private Long destUnivId;
    private Boolean deleteProfileImage;
}
