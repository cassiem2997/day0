package com.travel0.day0.users.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CountryResponse {
        String countryCode;
        String countryName;
}
