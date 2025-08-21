package com.travel0.day0.departures.dto;

import com.travel0.day0.common.enums.DepartureStatus;
import com.travel0.day0.common.enums.ProgramTypeCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartureInfoResponse {
    private Long departureId;
    private Long userId;
    private String userName;
    private String userNickname;
    private Long universityId;
    private String universityName;
    private Long programTypeId;
    private String programTypeName;
    private ProgramTypeCode programTypeCode;
    private String countryCode;
    private Instant startDate;
    private Instant endDate;
    private DepartureStatus status;
    private Instant createdAt;
}
