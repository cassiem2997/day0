package com.travel0.day0.account;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@ToString
@Builder
public class ProductRequestDto
{
    private Long productId;
    private String accountTypeUniqueNo;
    private String bankCode;
    private String bankName;
    private String accountTypeCode;    // 1:수시입출금, 2:정기예금, 3:정기적금, 4:대출
    private String accountTypeName;
    private String accountName;
    private String accountDescription;
    private String accountType;
}
