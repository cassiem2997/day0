package com.travel0.day0.savings.repository;

import com.travel0.day0.savings.domain.SavingsPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavingsPlanRepository extends JpaRepository<SavingsPlan, Long> {
    List<SavingsPlan> findByUser_UserIdAndActive(Long userId, boolean active);
}