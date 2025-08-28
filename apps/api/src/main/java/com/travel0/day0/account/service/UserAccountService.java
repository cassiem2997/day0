package com.travel0.day0.account.service;

import com.travel0.day0.account.domain.AccountTransaction;
import com.travel0.day0.account.domain.Product;
import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.account.repository.ProductRepository;
import com.travel0.day0.account.repository.TransactionRepository;
import com.travel0.day0.account.repository.UserAccountRepository;
import com.travel0.day0.auth.service.PrincipalDetails;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.users.service.UserKeyService;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAccountService {

    private final DemandDepositExternalPort externalPort;
    private final FinOpenApiProperties finOpenApiProperties;
    private final UserKeyService userKeyService;
    private final ProductRepository productRepository;
    private final UserAccountRepository userAccountRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private String resolveUserKey(Long localUserId) {
        String apiKey = finOpenApiProperties.getApiKey();
        return userKeyService.searchUserKey(localUserId, apiKey);
    }

    // 상품 목록 조회
    @Transactional(readOnly = true)
    public List<Rec> listProducts() {
        // DB에서 엔티티 목록 조회
        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(p -> DemandDepositDtos.Rec.builder()
                        .accountTypeUniqueNo(p.getAccountTypeUniqueNo())
                        .bankCode(p.getBankCode())
                        .bankName(p.getBankName())
                        .accountTypeName(p.getAccountTypeName())
                        .accountName(p.getAccountName())
                        .accountDescription(p.getAccountDescription())
                        .accountType(p.getAccountType().name())
                        .build())
                .toList();
    }

    // 계좌 생성
    @Transactional
    public CreateDemandDepositAccountRes createAccount(PrincipalDetails localUser, Long productId) {
        String userKey = resolveUserKey(localUser.getUserId());

        var product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음: " + productId));
        CreateDemandDepositAccountRes createRes =
                externalPort.createAccount(product.getAccountTypeUniqueNo(), userKey);

        // 생성 응답에서 생성한 계좌 정보 조회
        DemandDepositDtos.AccountRec created = (createRes.getREC() != null && !createRes.getREC().isEmpty())
                ? createRes.getREC().get(0) : null;
        if (created == null) throw new IllegalStateException("계좌 생성 응답에 REC가 없습니다.");

        String accountNo = created.getAccountNo();
        String bankCodeFromCreate = created.getBankCode();

        DemandDepositDtos.AccountListRec d = externalPort.inquireAccount(accountNo, userKey);
        if (d == null) throw new IllegalStateException("계좌 상세 조회 응답에 REC가 없습니다.");

        var userEntity = userRepository.getReferenceById(localUser.getUserId());

        // DB에 저장
        UserAccount ua = UserAccount.builder()
                .user(userEntity)
                .origin(UserAccount.Origin.INTERNAL)
                .provider(null)
                .bankCode(nvl(d.getBankCode(), bankCodeFromCreate))
                .bankName(d.getBankName())
                .accountNo(accountNo)
                .accountType(UserAccount.AccountType.DEPOSIT) // 수시입출금
                .currency(nvlUpper(d.getCurrency(), "KRW"))
                .accountBalance(toDecimal(d.getAccountBalance()))
                .dailyTransferLimit(toDecimal(d.getDailyTransferLimit()))
                .oneTimeTransferLimit(toDecimal(d.getOneTimeTransferLimit()))
                .accountCreateDate(parseYyyyMmDd(d.getAccountCreatedDate()))
                .accountExpireDate(parseYyyyMmDd(d.getAccountExpiryDate()))
                .lastTransactionDate(parseLastTx(d.getLastTransactionDate()))
                .active(true)
                .build();

        userAccountRepository.save(ua);

        return createRes;
    }

    @Transactional(readOnly = true)
    public List<AccountListRec> listAccounts(PrincipalDetails user) {
        Long localUserId = user.getUserId();
        var rows = userAccountRepository.findAllByUser_UserIdAndAccountTypeAndActiveTrue(
                localUserId, UserAccount.AccountType.DEPOSIT
        );
        return rows.stream()
                .map(ua -> toAccountListRec(ua, user))
                .toList();
    }

    private AccountListRec toAccountListRec(UserAccount ua, PrincipalDetails user) {
        return AccountListRec.builder()
                .bankCode(ua.getBankCode())
                .bankName(ua.getBankName())
                .userName(user.getUsername())
                .accountNo(ua.getAccountNo())
                .accountName(null)
                .accountTypeCode("1")
                .accountTypeName("수시입출금")
                .accountCreatedDate(fmtYmd(ua.getAccountCreateDate()))
                .accountExpiryDate(fmtYmd(ua.getAccountExpireDate()))
                .dailyTransferLimit(nvlLong(ua.getDailyTransferLimit()))
                .oneTimeTransferLimit(nvlLong(ua.getOneTimeTransferLimit()))
                .accountBalance(nvlLongScale0(ua.getAccountBalance()))
                .lastTransactionDate(fmtInstant(ua.getLastTransactionDate()))
                .currency(nvlUpper(ua.getCurrency(), "KRW"))
                .build();
    }

    @Transactional(readOnly = true)
    public AccountListRec getAccount(PrincipalDetails user, Long accountId) {
        var ua = userAccountRepository
                .findByAccountIdAndUser_UserId(accountId, user.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("계좌가 없거나 접근 권한이 없습니다."));
        return toAccountListRec(ua, user);
    }

    @Transactional(readOnly = true)
    public AccountBalanceRec getBalance(Long localUserId, Long accountId) {
        var account = userAccountRepository.findByAccountIdAndUser_UserId(accountId, localUserId)
                .orElseThrow(() -> new IllegalArgumentException("계좌가 없거나 접근 권한이 없습니다."));

        return AccountBalanceRec.builder()
                .accountNo(account.getAccountNo())
                .bankCode(account.getBankCode())
                .accountBalance(account.getAccountBalance().longValue())
                .accountCreatedDate(String.valueOf(account.getAccountCreateDate()))
                .accountExpiryDate(String.valueOf(account.getAccountExpireDate()))
                .lastTransactionDate(String.valueOf(account.getLastTransactionDate()))
                .currency(account.getCurrency())
                .build();
    }

    @Transactional(readOnly = true)
    public inquireTransactionHistoryListRes listTransactions(
            Long userId,
            Long accountId,
            String startDate,
            String endDate,
            String transactionType, // A|1|2
            String orderByType      // ASC|DESC
    ) {
        var ua = userAccountRepository.findByAccountIdAndUser_UserId(accountId, userId)
                .orElseThrow(() -> new IllegalArgumentException("계좌가 없거나 접근 권한이 없습니다."));
        // 정렬
        Sort sort = "ASC".equalsIgnoreCase(orderByType)
                ? Sort.by(Sort.Order.asc("transactionDate"), Sort.Order.asc("transactionTime"))
                : Sort.by(Sort.Order.desc("transactionDate"), Sort.Order.desc("transactionTime"));

        // 조회
        List<AccountTransaction> list = (
                "A".equalsIgnoreCase(transactionType)
                        ? transactionRepository.findByAccount_AccountIdAndTransactionDateBetween(
                        ua.getAccountId(), startDate, endDate, sort)
                        : transactionRepository.findByAccount_AccountIdAndTransactionTypeAndTransactionDateBetween(
                        ua.getAccountId(), transactionType, startDate, endDate, sort)
        );

        // 매핑
        List<eachTransactionRec> recs = list.stream()
                .map(tx -> eachTransactionRec.builder()
                        .transactionUniqueNo(tx.getTransactionUniqueNo())
                        .transactionDate(tx.getTransactionDate())
                        .transactionTime(tx.getTransactionTime())
                        .transactionType(tx.getTransactionType())
                        .transactionTypeName(tx.getTransactionTypeName())
                        .transactionAccountNo(tx.getTransactionAccountNo())
                        .transactionBalance(tx.getTransactionBalance().longValue())
                        .transactionAfterBalance(tx.getTransactionAfterBalance().longValue())
                        .transactionSummary(tx.getTransactionSummary())
                        .transactionMemo(tx.getTransactionMemo())
                        .build()
                ).toList();

        var txRecContainer = TransactionRec.builder()
                .totalCount(String.valueOf(recs.size()))
                .list(recs)
                .build();

        return inquireTransactionHistoryListRes.builder()
                .Header(null)
                .REC(txRecContainer)
                .build();
    }

    // ----- 유틸 -----
    private String fmtYmd(LocalDate d) {
        return d == null ? null : d.format(DateTimeFormatter.BASIC_ISO_DATE); // YYYYMMDD
    }
    private String fmtInstant(Instant i) {
        return i == null ? null : DateTimeFormatter.ISO_INSTANT.format(i);    // ISO-8601
    }
    private Long nvlLong(java.math.BigDecimal v) {
        return v == null ? 0L : v.longValue();
    }
    private Long nvlLongScale0(java.math.BigDecimal v) {
        return v == null ? 0L : v.longValue();
    }
    private static String nvl(String v, String def) {
        return (v == null || v.isBlank()) ? def : v;
    }
    private static String nvlUpper(String v, String def) {
        return (v == null || v.isBlank()) ? def : v.toUpperCase();
    }
    private static BigDecimal toDecimal(Long v) {
        if (v == null) return new BigDecimal("0");
        return new BigDecimal(v);
    }
    private static LocalDate parseYyyyMmDd(String s) {
        if (s == null || s.isBlank()) return null;
        return LocalDate.parse(s, DateTimeFormatter.BASIC_ISO_DATE);
    }
    private static Instant parseLastTx(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Instant.parse(s);
        } catch (Exception e) {
            return null;
        }
    }
}
