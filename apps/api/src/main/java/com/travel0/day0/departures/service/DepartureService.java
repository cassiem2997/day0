package com.travel0.day0.departures.service;

import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.departures.dto.DepartureCreateRequest;
import com.travel0.day0.departures.dto.DepartureInfoResponse;
import com.travel0.day0.departures.dto.DepartureUpdateRequest;
import com.travel0.day0.departures.repository.DepartureInfoRepository;
import com.travel0.day0.users.domain.ProgramType;
import com.travel0.day0.users.domain.University;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.ProgramTypeRepository;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.users.repository.UniversityRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartureService {
    private final DepartureInfoRepository departureInfoRepo;
    private final UserRepository userRepo;
    private final UniversityRepository universityRepo;
    private final ProgramTypeRepository programTypeRepo;


    @Transactional
    public DepartureInfoResponse createDeparture(DepartureCreateRequest req) {
        User user = userRepo.findById(req.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. "));

        University university = universityRepo.findById(req.getUniversityId())
                .orElseThrow(() -> new RuntimeException("대학교를 찾을 수 없습니다. "));

        ProgramType programType = programTypeRepo.findById(req.getProgramTypeId())
                .orElseThrow(() -> new RuntimeException("프로그램이 존재하지 않습니다."));

        DepartureInfo departureInfo = DepartureInfo.builder()
                .user(user)
                .university(university)
                .programType(programType)
                .countryCode(req.getCountryCode())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .status(req.getStatus())
                .build();

        departureInfoRepo.save(departureInfo);
        return convertToResponse(departureInfo);
    }


    public DepartureInfoResponse getDepartureInfo(Long departureId) {
        DepartureInfo departureInfo = departureInfoRepo.findById(departureId)
                .orElseThrow(() -> new RuntimeException("출국 정보를 찾을 수 없습니다."));

        return convertToResponse(departureInfo);
    }

    public List<DepartureInfoResponse> getDepartureInfoList(Long userId) {
        List<DepartureInfo> departureInfoList = departureInfoRepo.findByUser_UserId(userId);
        return departureInfoList.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartureInfoResponse updateDepartureInfo(Long departureId, DepartureUpdateRequest req) {
        DepartureInfo departureInfo = departureInfoRepo.findById(departureId)
                .orElseThrow(() -> new RuntimeException("출국 정보를 찾을 수 없습니다"));

        if (req.getUniversityId() != null) {
            University university = universityRepo.findById(req.getUniversityId())
                    .orElseThrow(() -> new RuntimeException("대학교를 찾을 수 없습니다"));
            departureInfo.setUniversity(university);
        }

        if (req.getProgramTypeId() != null) {
            ProgramType programType = programTypeRepo.findById(req.getProgramTypeId())
                    .orElseThrow(() -> new RuntimeException("프로그램 타입을 찾을 수 없습니다: " + req.getProgramTypeId()));
            departureInfo.setProgramType(programType);
        }

        if (req.getCountryCode() != null) {
            departureInfo.setCountryCode(req.getCountryCode());
        }

        if (req.getStartDate() != null) {
            departureInfo.setStartDate(req.getStartDate());
        }

        if (req.getEndDate() != null) {
            departureInfo.setEndDate(req.getEndDate());
        }

        if (req.getStatus() != null) {
            departureInfo.setStatus(req.getStatus());
        }
        DepartureInfo updatedDeparture = departureInfoRepo.save(departureInfo);
        return convertToResponse(updatedDeparture);
    }

    @Transactional
    public void deleteDeparture(Long departureId){
        departureInfoRepo.deleteById(departureId);
    }

    private DepartureInfoResponse convertToResponse(DepartureInfo departureInfo) {
        return DepartureInfoResponse.builder()
                .departureId(departureInfo.getDepartureId())
                .userId(departureInfo.getUser().getUserId())
                .userName(departureInfo.getUser().getName())
                .userNickname(departureInfo.getUser().getNickname())
                .universityId(departureInfo.getUniversity() != null ?
                        departureInfo.getUniversity().getUniversityId() : null)
                .universityName(departureInfo.getUniversity() != null ?
                        departureInfo.getUniversity().getName() : null)
                .programTypeId(departureInfo.getProgramType() != null ?
                        departureInfo.getProgramType().getProgramTypeId() : null)
                .programTypeName(departureInfo.getProgramType() != null ?
                        departureInfo.getProgramType().getName() : null)
                .programTypeCode(departureInfo.getProgramType() != null ?
                        departureInfo.getProgramType().getCode() : null)
                .countryCode(departureInfo.getCountryCode())
                .startDate(departureInfo.getStartDate())
                .endDate(departureInfo.getEndDate())
                .status(departureInfo.getStatus())
                .createdAt(departureInfo.getCreatedAt())
                .build();
    }
}
