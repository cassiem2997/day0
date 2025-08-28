package com.travel0.day0.savings.service;

import com.travel0.day0.account.domain.AccountTransaction;
import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.account.repository.TransactionRepository;
import com.travel0.day0.account.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/**
 * 공통 포스팅: 계좌를 락으로 잡고 after_balance 계산 → 거래 저장 → 계좌 잔액, 마지막거래시각 갱신
 * @param credit true면 입금(+) / false면 출금(-)
 */

@Service
@RequiredArgsConstructor
public class LedgerService {
    private final UserAccountRepository accountRepository;
    private final TransactionRepository txRepository;

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter HMS = DateTimeFormatter.ofPattern("HHmmss");

    @Transactional
    public AccountTransaction postTxn(UserAccount account,
                                      boolean credit,
                                      BigDecimal amount,
                                      String summary,
                                      String memo,
                                      String counterAccountNo,
                                      String externalTxId,
                                      String idem) {

        // 1) 계좌 락 & 현재 잔액 확보
        UserAccount locked = accountRepository.lockById(account.getAccountId())
                .orElseThrow(() -> new IllegalStateException("account not found: " + account.getAccountId()));

        // 2) 금액/시간 계산
        var nowKst = ZonedDateTime.now(KST);
        String ymd = nowKst.format(YMD);
        String hms = nowKst.format(HMS);
        BigDecimal before = locked.getAccountBalance();
        BigDecimal delta  = credit ? amount : amount.negate();
        BigDecimal after  = before.add(delta).setScale(2, RoundingMode.HALF_UP);

        // 3) 거래 엔티티 생성/저장
        AccountTransaction tx = AccountTransaction.builder()
                .account(locked)
                .transactionUniqueNo(parseTxNo(externalTxId, idem))
                .transactionDate(ymd)
                .transactionTime(hms)
                .transactionType(credit ? "1" : "2")     // 1=입금, 2=출금
                .transactionTypeName(credit ? "입금" : "출금")
                .transactionAccountNo(counterAccountNo)
                .transactionBalance(amount)
                .transactionAfterBalance(after)
                .transactionSummary(summary)
                .transactionMemo(memo)
                .idempotencyKey(idem)
                .build();
        tx = txRepository.save(tx);

        // 4) 계좌 잔액/최종거래시각 갱신
        accountRepository.updateBalanceAndTouch(locked.getAccountId(), after, nowKst.toInstant());

        return tx;
    }

    // 외부거래번호가 숫자가 아닐 수도 있으니 BIGINT로 매핑
    private long parseTxNo(String externalTxId, String idem) {
        try {
            if (externalTxId != null) return Long.parseLong(externalTxId);
        } catch (NumberFormatException ignore) {}
        // 외부 번호가 없으면 멱등키 해시로 유사-고유값 생성 (계좌별 UNIQUE 보장에 기여)
        return Math.abs(Objects.hash(idem, Instant.now().toEpochMilli()));
    }
}
