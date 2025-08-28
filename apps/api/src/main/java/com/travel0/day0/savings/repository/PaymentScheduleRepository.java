package com.travel0.day0.savings.repository;

import com.travel0.day0.common.enums.PaymentStatus;
import com.travel0.day0.savings.domain.PaymentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface PaymentScheduleRepository extends JpaRepository<PaymentSchedule, Long> {
    List<PaymentSchedule> findByPlan_PlanId(Long planId);

    @Modifying
    @Query("delete from PaymentSchedule ps where ps.plan.planId = :planId and ps.status in :statuses")
    void deleteByPlanIdAndStatusIn(@Param("planId") Long planId, @Param("statuses") List<PaymentStatus> statuses);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update PaymentSchedule ps
           set ps.status = :skipped,
               ps.executedAt = :now,
               ps.failureReason = :reason
         where ps.plan.planId = :planId
           and ps.planDate > :now
           and ps.status in :statuses
    """)
    int skipFuture(@Param("planId") Long planId,
                   @Param("now") Instant now,
                   @Param("statuses") List<PaymentStatus> statuses,
                   @Param("skipped") PaymentStatus skipped,
                   @Param("reason") String reason);

    @Query(value = """
        SELECT * FROM payment_schedule
         WHERE status = 'PENDING'
           AND plan_date <= :nowTs
         ORDER BY plan_date ASC
         LIMIT :limit
         FOR UPDATE SKIP LOCKED
        """, nativeQuery = true)
    List<PaymentSchedule> claimDueForUpdateSkipLocked(@Param("nowTs") Instant nowTs,
                                                      @Param("limit") int limit);
}