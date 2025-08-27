package com.travel0.day0.community.util;

import com.travel0.day0.community.constants.CommunityConstants;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

public class CommunityUtils {

    private static final Map<String, String> COUNTRY_NAMES = Map.of(
            "US", "미국",
            "JP", "일본", 
            "DE", "독일",
            "KR", "한국"
    );

    /**
     * 국가 코드를 국가명으로 변환
     */
    public static String getCountryName(String countryCode) {
        return COUNTRY_NAMES.getOrDefault(countryCode, countryCode);
    }

    /**
     * 게시글 본문 미리보기 생성
     */
    public static String createPostPreview(String body) {
        if (body == null || body.trim().isEmpty()) {
            return "";
        }
        
        String cleanBody = body.replaceAll("<[^>]*>", "").trim(); // HTML 태그 제거
        
        if (cleanBody.length() <= CommunityConstants.POST_PREVIEW_LENGTH) {
            return cleanBody;
        }
        
        return cleanBody.substring(0, CommunityConstants.POST_PREVIEW_LENGTH) + "...";
    }

    /**
     * 상대적 시간 표시 (예: "2시간 전", "3일 전")
     */
    public static String getRelativeTime(Instant instant) {
        if (instant == null) {
            return "";
        }

        Instant now = Instant.now();
        long minutes = ChronoUnit.MINUTES.between(instant, now);
        long hours = ChronoUnit.HOURS.between(instant, now);
        long days = ChronoUnit.DAYS.between(instant, now);

        if (minutes < 60) {
            return minutes <= 1 ? "방금 전" : minutes + "분 전";
        } else if (hours < 24) {
            return hours + "시간 전";
        } else if (days < 30) {
            return days + "일 전";
        } else {
            return days / 30 + "개월 전";
        }
    }

    /**
     * 카테고리명을 한글로 변환
     */
    public static String getCategoryDisplayName(String category) {
        return switch (category) {
            case CommunityConstants.CATEGORY_TIPS -> "팁 공유";
            case CommunityConstants.CATEGORY_QNA -> "질문/답변";
            case CommunityConstants.CATEGORY_REVIEW -> "후기";
            case CommunityConstants.CATEGORY_URGENT -> "긴급";
            case CommunityConstants.CATEGORY_GENERAL -> "일반";
            default -> "기타";
        };
    }

    /**
     * 페이지 크기 검증 및 조정
     */
    public static int validatePageSize(int size) {
        if (size <= 0) {
            return CommunityConstants.DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, CommunityConstants.MAX_PAGE_SIZE);
    }

    /**
     * 마일리지 포맷팅 (예: 1500 -> "1,500M")
     */
    public static String formatMileage(long mileage) {
        return String.format("%,dM", mileage);
    }
}