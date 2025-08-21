package com.travel0.day0.deparatures.repository;

import com.travel0.day0.deparatures.domain.DepartureInfo;
import com.travel0.day0.deparatures.dto.DepartureInfoResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartureInfoRepository extends JpaRepository<DepartureInfo, Long> {

    List<DepartureInfo> findByUser_UserId(Long userId);
}
