package com.travel0.day0.finopenapi.support;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.CommonHeader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.*;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class HeaderFactory {

    private final FinOpenApiProperties props;
    private static final SecureRandom RND = new SecureRandom();
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter T = DateTimeFormatter.ofPattern("HHmmss");
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /** 난수 6자리 */
    private static String rand6() {
        int n = RND.nextInt(1_000_000);
        return String.format("%06d", n);
    }

    /** YYYYMMDDHHmmss + 6자리 */
    private static String uniqueNo(Instant instant) {
        ZonedDateTime zdt = instant.atZone(ZoneId.of("Asia/Seoul"));
        return zdt.format(TS) + rand6();
    }

    /** userKey가 필요 없는 API용 */
    public CommonHeader.Req build(String apiName, String apiServiceCode) {
        Instant now = Instant.now();
        ZonedDateTime seoulNow = now.atZone(ZoneId.of("Asia/Seoul"));

        return CommonHeader.Req.builder()
                .apiName(apiName)
                .transmissionDate(seoulNow.format(D))   // yyyyMMdd (KST)
                .transmissionTime(seoulNow.format(T))   // HHmmss (KST)
                .institutionCode(props.getInstitutionCode())
                .fintechAppNo(props.getFintechAppNo())
                .apiServiceCode(apiServiceCode)
                .institutionTransactionUniqueNo(uniqueNo(now)) // uniqueNo는 Instant 기반
                .apiKey(props.getApiKey())
                .build();
    }

    /** userKey가 필요한 API용 */
    public CommonHeader.Req build(String apiName, String apiServiceCode, String userKey) {
        CommonHeader.Req req = build(apiName, apiServiceCode);
        req.setUserKey(userKey);
        return req;
    }
}
