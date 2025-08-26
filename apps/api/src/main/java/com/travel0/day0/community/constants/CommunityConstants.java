package com.travel0.day0.community.constants;

public class CommunityConstants {
    
    // 카테고리 상수
    public static final String CATEGORY_TIPS = "TIPS";           // 팁 공유
    public static final String CATEGORY_QNA = "QNA";             // 질문/답변
    public static final String CATEGORY_REVIEW = "REVIEW";       // 후기
    public static final String CATEGORY_GENERAL = "GENERAL";     // 일반
    public static final String CATEGORY_URGENT = "URGENT";       // 긴급
    
    // 정렬 옵션 상수
    public static final String SORT_LATEST = "latest";          // 최신순
    public static final String SORT_POPULAR = "popular";        // 인기순 (좋아요)
    public static final String SORT_REPLIES = "replies";        // 댓글많은순
    public static final String SORT_OLDEST = "oldest";          // 오래된순
    
    // 페이징 기본값
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    
    // 콘텐츠 제한
    public static final int MAX_POST_TITLE_LENGTH = 200;
    public static final int MAX_POST_BODY_LENGTH = 10000;
    public static final int MAX_REPLY_LENGTH = 1000;
    public static final int MAX_CATEGORY_LENGTH = 50;
    
    // 미리보기 설정
    public static final int POST_PREVIEW_LENGTH = 100;          // 게시글 본문 미리보기 길이
    
    // 마일리지 설정
    public static final int MILEAGE_POST_CREATE = 100;      // 질문 작성
    public static final int MILEAGE_REPLY_CREATE = 50;      // 답변 작성
    public static final int MILEAGE_REPLY_ADOPTED = 200;    // 답변 채택됨 (답변자)
    public static final int MILEAGE_ADOPT_REPLY = 50;       // 답변 채택함 (질문자)
    public static final int MILEAGE_CHECKLIST_SHARE = 500;  // 체크리스트 공유
    
    // 쿠폰 가격
    public static final int COUPON_EXCHANGE_1_PERCENT = 1000;    // 환전 1% 우대 쿠폰
    public static final int COUPON_EXCHANGE_2_PERCENT = 2000;    // 환전 2% 우대 쿠폰
    public static final int COUPON_INSURANCE_PER_PERCENT = 100;  // 보험 할인 1%당 마일리지
    
    // 국가 코드 매핑
    public static final String COUNTRY_US = "US";
    public static final String COUNTRY_JP = "JP";
    public static final String COUNTRY_DE = "DE";
    public static final String COUNTRY_KR = "KR";
}