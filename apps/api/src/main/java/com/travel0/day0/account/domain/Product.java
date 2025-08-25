package com.travel0.day0.account.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "products",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_prod", columnNames = {"bank_code", "account_type_unique_no"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Long id;   // PK

    @Column(name = "account_type_unique_no", length = 20, nullable = false)
    private String accountTypeUniqueNo; // 상품 고유번호

    @Column(name = "bank_code", length = 3, nullable = false)
    private String bankCode; // 은행코드

    @Column(name = "bank_name", length = 20, nullable = false)
    private String bankName; // 은행명

    @Column(name = "account_type_name", length = 20, nullable = false)
    private String accountTypeName; // 상품구분명

    @Column(name = "account_name", length = 50, nullable = false)
    private String accountName; // 상품명

    @Column(name = "account_description", length = 255)
    private String accountDescription; // 상품설명

    @Enumerated(EnumType.STRING)
    @Column(
            name = "account_type",
            nullable = false,
            columnDefinition = "ENUM('DOMESTIC','OVERSEAS') default 'DOMESTIC'"
    )
    @Builder.Default
    private AccountType accountType = AccountType.DOMESTIC; // 통화 구분

    /** ENUM 정의 */
    public enum AccountType {
        DOMESTIC, OVERSEAS
    }
}
