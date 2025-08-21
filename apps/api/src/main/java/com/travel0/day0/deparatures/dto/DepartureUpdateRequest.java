package com.travel0.day0.deparatures.dto;

import com.travel0.day0.common.enums.DepartureStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartureUpdateRequest {
    private Long universityId;
    private Long programTypeId;
    private String countryCode;
    private Instant startDate;
    private Instant endDate;
    private DepartureStatus status;
}

