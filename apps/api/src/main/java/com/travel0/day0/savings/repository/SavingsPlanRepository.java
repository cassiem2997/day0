package com.travel0.day0.savings.repository;

import com.travel0.day0.savings.domain.SavingsPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SavingsPlanRepository extends JpaRepository<SavingsPlan, Long> {
    List<SavingsPlan> findByUser_UserIdAndActive(Long userId, boolean active);
    @Query("""
        select p from SavingsPlan p
        join fetch p.withdrawAccount wa
        join fetch p.savingAccount  sa
        where p.planId = :planId
    """)
    Optional<SavingsPlan> findDetailById(@Param("planId") Long planId);

    @Query("""
        select p
          from SavingsPlan p
          left join fetch p.withdrawAccount wa
          left join fetch p.savingAccount  sa
         where p.planId = :planId
    """)
    Optional<SavingsPlan> findByIdWithAccounts(@Param("planId") Long planId);

    List<SavingsPlan> findByActiveTrueAndEndDateBefore(Instant now);
}