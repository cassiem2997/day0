package com.travel0.day0.departures.repository;

import com.travel0.day0.departures.domain.DepartureInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartureInfoRepository extends JpaRepository<DepartureInfo, Long> {

    List<DepartureInfo> findByUser_UserId(Long userId);
}
