package com.travel0.day0.savings.repository;

import com.travel0.day0.account.domain.AccountTransaction;
import com.travel0.day0.common.enums.SavingTxnStatus;
import com.travel0.day0.savings.domain.PaymentSchedule;
import com.travel0.day0.savings.domain.SavingTxn;
import com.travel0.day0.savings.domain.SavingsPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface SavingTxnRepository
        extends JpaRepository<SavingTxn, Long>, JpaSpecificationExecutor<SavingTxn> {
    Optional<SavingTxn> findByPlan_PlanIdAndIdempotencyKey(Long planId, String idem);

    @Modifying
    @Query("""
        update SavingTxn t
           set t.status='FAILED',
               t.failureReason=:reason,
               t.processedAt = CURRENT_TIMESTAMP
         where t.txnId = :txnId
    """)
    void markFailed(@Param("txnId") Long txnId, @Param("reason") String reason);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
  update SavingTxn t
     set t.status='SUCCESS',
         t.externalTxId=:extId,
         t.postingTx   =:postingTx,
         t.processedAt = CURRENT_TIMESTAMP
   where t.txnId = :txnId
""")
    void markSuccess(@Param("txnId") Long txnId,
                     @Param("extId") String extId,
                     @Param("postingTx") AccountTransaction postingTx);

    // 편의 생성
    default SavingTxn received(SavingsPlan plan, PaymentSchedule schedule, BigDecimal amount, String idem) {
        SavingTxn t = new SavingTxn();
        t.setPlan(plan);
        t.setSchedule(schedule);
        t.setAmount(amount);
        t.setIdempotencyKey(idem);
        t.setStatus(SavingTxnStatus.RECEIVED);
        return save(t);
    }
}