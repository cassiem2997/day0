package com.travel0.day0.bank.service;

import com.travel0.day0.account.domain.Product;
import com.travel0.day0.account.repository.ProductRepository;
import com.travel0.day0.bank.port.BankExternalPort;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BankService {

    private final BankExternalPort external;
    private final ProductRepository productRepository;

    public List<BankExternalPort.BankCode> getBankCodes() {
        return external.inquireBankCodes();
    }

    public DemandDepositDtos.CreateDemandDepositRes register(String bankCode, String name, String desc) {
        DemandDepositDtos.CreateDemandDepositRes res =
                external.registerProduct(bankCode, name, desc);
        // DB에 계좌 등록
        DemandDepositDtos.Rec rec = res.getREC();
        upsertProduct(rec);

        return res;
    }

    private void upsertProduct(DemandDepositDtos.Rec req) {
        var opt = productRepository.findByBankCodeAndAccountTypeUniqueNo(
                req.getBankCode(), req.getAccountTypeUniqueNo()
        );

        var accountTypeEnum = Product.AccountType.valueOf(req.getAccountType().toUpperCase());

        if (opt.isPresent()) {
            // 이미 존재 → 최신 값으로 갱신
            var p = opt.get();
            p.setBankName(req.getBankName());
            p.setAccountTypeName(req.getAccountTypeName());
            p.setAccountName(req.getAccountName());
            p.setAccountDescription(req.getAccountDescription());
            p.setAccountType(accountTypeEnum);
        } else {
            // 신규 생성
            var p = Product.builder()
                    .accountTypeUniqueNo(req.getAccountTypeUniqueNo())
                    .bankCode(req.getBankCode())
                    .bankName(req.getBankName())
                    .accountTypeName(req.getAccountTypeName())
                    .accountName(req.getAccountName())
                    .accountDescription(req.getAccountDescription())
                    .accountType(accountTypeEnum)
                    .build();
            productRepository.save(p);
        }
    }
}
