package com.travel0.day0.savings.dto;

import com.travel0.day0.finopenapi.dto.CommonHeader;
import lombok.*;

public class DemandDepositDtos {
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    @Builder
    public static class DeleteDemandDepositAccountReq {
        private CommonHeader.Req Header;
        private String accountNo;
        private String refundAccountNo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @Builder
    public static class DeleteDemandDepositAccountRes {
        private CommonHeader.Res Header;
        private String resultCode;
        private String resultMessage;
    }
}
