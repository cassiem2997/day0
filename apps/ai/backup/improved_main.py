# main.py - 개선된 AI 추천 서비스 (사용자 유형 분류 제거, 한국어 최적화)

from dotenv import load_dotenv
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import mysql.connector
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import re
import decimal  
import hashlib

load_dotenv()

# =============================================================================
# DB 설정
# =============================================================================
def get_db_config():
    mysql_host = os.getenv('MYSQLHOST')
    mysql_port = os.getenv('MYSQLPORT')
    mysql_user = os.getenv('MYSQLUSER') 
    mysql_password = os.getenv('MYSQLPASSWORD')
    mysql_database = os.getenv('MYSQLDATABASE')
    
    if mysql_host and mysql_user and mysql_database:
        print("🚄 Railway MySQL 환경 감지")
        return {
            'host': mysql_host,
            'port': int(mysql_port) if mysql_port else 3306,
            'user': mysql_user,
            'password': mysql_password or '',
            'database': mysql_database,
            'charset': 'utf8mb4'
        }
    
    print("💻 로컬 MySQL 환경으로 설정")
    return {
        'host': os.getenv('LOCAL_MYSQL_HOST', 'localhost'),
        'port': int(os.getenv('LOCAL_MYSQL_PORT', 3306)),
        'user': os.getenv('LOCAL_MYSQL_USER', 'root'),
        'password': os.getenv('LOCAL_MYSQL_PASSWORD', ''),
        'database': os.getenv('LOCAL_MYSQL_DATABASE', 'day0_db'),
        'charset': 'utf8mb4'
    }

DB_CONFIG = get_db_config()
app = FastAPI(title="Day-0 AI Recommendation Service", version="2.0.0")

# =============================================================================
# 메모리 캐시
# =============================================================================
cache_dict = {}

def get_cache_key(endpoint: str, country_code: str, program_type_id: int, items_hash: str = ""):
    if items_hash:
        return f"{endpoint}:{country_code}:{program_type_id}:{items_hash}"
    return f"{endpoint}:{country_code}:{program_type_id}"

def hash_items(items: List[dict]) -> str:
    titles = sorted([item.get('title', '') for item in items])
    return hashlib.md5('|'.join(titles).encode()).hexdigest()[:8]

def get_from_cache(cache_key: str, max_age_hours: int = 1):
    if cache_key in cache_dict:
        cache_entry = cache_dict[cache_key]
        age = datetime.now() - cache_entry['created']
        if age < timedelta(hours=max_age_hours):
            print(f"✅ 캐시 히트: {cache_key}")
            return cache_entry['data']
        else:
            del cache_dict[cache_key]
            print(f"🗂 캐시 만료: {cache_key}")
    return None

def save_to_cache(cache_key: str, data: any):
    cache_dict[cache_key] = {
        'data': data,
        'created': datetime.now()
    }
    print(f"💾 캐시 저장: {cache_key}")

# =============================================================================
# 데이터 모델
# =============================================================================
class ChecklistItem(BaseModel):
    title: str
    description: Optional[str] = ""
    tag: str = "NONE"
    status: str = "TODO"

class MissingItemsRequest(BaseModel):
    existing_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str

class MissingItem(BaseModel):
    item_title: str
    item_description: str
    item_tag: str
    popularity_rate: float
    avg_offset_days: int
    priority_score: int
    missing_reason: str
    confidence_score: float
    urgency_level: str

class MissingItemsResponse(BaseModel):
    missing_items: List[MissingItem]
    total_missing: int
    recommendation_summary: str
    analysis_method: str

class PriorityReorderRequest(BaseModel):
    current_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str

class PriorityItem(BaseModel):
    title: str
    description: str
    tag: str
    original_priority: int
    ai_priority: int
    urgency_score: float
    reorder_reason: str

class PriorityReorderResponse(BaseModel):
    reordered_items: List[PriorityItem]
    total_reordered: int
    days_until_departure: int
    reorder_summary: str

# =============================================================================
# 한국어 최적화 AI 엔진
# =============================================================================
class KoreanOptimizedAI:
    """한국어 최적화 AI 추천 엔진 (사용자 유형 분류 제거)"""
    
    def __init__(self):
        # 한국어 불용어 (의미 없는 단어들)
        self.korean_stopwords = {
            '그리고', '그러나', '그런데', '또한', '하지만', '그래서', '따라서', '그런', '그럼',
            '준비', '확인', '신청', '발급', '예약', '완료', '등록', '제출', '접수', '처리',
            '이', '그', '저', '것', '들', '수', '있', '없', '하', '되', '말', '의', '을', '를',
            '때', '곳', '더', '잘', '좀', '많', '적', '크', '작', '같', '다른', '새로운',
            '해야', '해야함', '필요', '중요', '꼭', '반드시', '미리', '나중', '먼저', '다음'
        }
        
        # 국가별 핵심 키워드
        self.country_keywords = {
            'US': ['f-1', 'sevis', 'i-20', 'ds-160', '영사관', '인터뷰', 'ssn', '소셜시큐리티'],
            'JP': ['재류카드', '국민건강보험', '거주지신고', '일본어', '엔화'],
            'DE': ['anmeldung', '거주지등록', 'blocked account', '독일어', '유로']
        }
        
    def extract_meaningful_keywords(self, text: str) -> set:
        """한국어 텍스트에서 의미있는 키워드만 추출"""
        if not text:
            return set()
            
        # 한글, 영문, 숫자, 하이픈만 남기기
        keywords = re.findall(r'[가-힣a-zA-Z0-9\-]+', text.lower())
        
        # 불용어 제거 및 2글자 이상만
        meaningful_keywords = []
        for keyword in keywords:
            if (len(keyword) >= 2 and 
                keyword not in self.korean_stopwords and 
                not keyword.isdigit()):  # 순수 숫자 제외
                meaningful_keywords.append(keyword)
        
        return set(meaningful_keywords)
    
    def calculate_semantic_similarity(self, user_items: List[dict], popular_items: List[dict]) -> List[dict]:
        """개선된 의미적 유사도 계산 (한국어 특화)"""
        
        if not user_items or not popular_items:
            return popular_items[:3]  # 사용자 데이터 없으면 상위 3개 반환
        
        print(f"🔍 의미적 유사도 분석: 사용자 {len(user_items)}개 vs 인기 {len(popular_items)}개 항목")
        
        # 텍스트 준비
        user_texts = []
        for item in user_items:
            text = f"{item['title']} {item.get('description', '')}"
            user_texts.append(text)
        
        popular_texts = []
        for item in popular_items:
            text = f"{item['item_title']} {item.get('item_description', '')}"
            popular_texts.append(text)
        
        try:
            # 한국어 특화 TF-IDF 설정
            vectorizer = TfidfVectorizer(
                max_features=30,           # 피처 수 줄임 (속도 향상)
                ngram_range=(1, 2),        # 1-2 글자 조합
                analyzer='char',           # 문자 단위 (한국어에 효과적)
                min_df=1,                  # 최소 1번은 나타나야 함
                lowercase=True
            )
            
            all_texts = user_texts + popular_texts
            if not all_texts or all(not text.strip() for text in all_texts):
                print("⚠️ 텍스트 데이터 부족 - 키워드 방식으로 폴백")
                return self._fallback_keyword_analysis(user_items, popular_items)
            
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            
            # 벡터 분리
            user_vectors = tfidf_matrix[:len(user_texts)]
            popular_vectors = tfidf_matrix[len(user_texts):]
            
            # 코사인 유사도 계산
            similarities = cosine_similarity(popular_vectors, user_vectors)
            
            # 새로운 항목 찾기 (유사도 0.25 미만)
            novel_items = []
            for i, popular_item in enumerate(popular_items):
                max_similarity = similarities[i].max() if similarities[i].size > 0 else 0
                
                if max_similarity < 0.25:  # 75% 이상 다른 항목
                    novelty_score = 1 - max_similarity
                    novel_items.append({
                        **popular_item,
                        'semantic_novelty': novelty_score,
                        'similarity_analysis': f"기존 항목과 {novelty_score*100:.0f}% 다른 새로운 준비사항"
                    })
                    print(f"✨ 새로운 항목 발견: {popular_item['item_title']} (차이도: {novelty_score:.2f})")
            
            # 인기도 순으로 정렬하여 상위 5개
            novel_items.sort(key=lambda x: x['popularity_rate'], reverse=True)
            return novel_items[:5]
            
        except Exception as e:
            print(f"🔧 TF-IDF 분석 실패 ({e}) - 키워드 방식으로 전환")
            return self._fallback_keyword_analysis(user_items, popular_items)
    
    def _fallback_keyword_analysis(self, user_items: List[dict], popular_items: List[dict]) -> List[dict]:
        """폴백: 키워드 기반 분석"""
        # 사용자 키워드 수집
        user_keywords = set()
        for item in user_items:
            text = f"{item['title']} {item.get('description', '')}"
            user_keywords.update(self.extract_meaningful_keywords(text))
        
        print(f"👤 사용자 키워드: {list(user_keywords)[:10]}...")  # 처음 10개만 출력
        
        # 겹치지 않는 항목 찾기
        novel_items = []
        for popular_item in popular_items:
            pop_text = f"{popular_item['item_title']} {popular_item.get('item_description', '')}"
            pop_keywords = self.extract_meaningful_keywords(pop_text)
            
            # 교집합 계산
            intersection = len(user_keywords & pop_keywords)
            union = len(user_keywords | pop_keywords)
            jaccard_score = intersection / union if union > 0 else 0
            
            if jaccard_score < 0.2:  # 80% 이상 다르면
                novel_items.append({
                    **popular_item,
                    'keyword_novelty': 1 - jaccard_score,
                    'similarity_analysis': f"키워드 분석: {(1-jaccard_score)*100:.0f}% 새로운 항목"
                })
        
        return novel_items[:5]
    
    def calculate_dynamic_urgency(self, item: dict, departure_date: datetime) -> tuple:
        """수학적 긴급도 계산 (시그모이드 함수)"""
        days_left = (departure_date - datetime.now()).days
        typical_prep_days = abs(item.get('avg_offset_days', 30))
        
        # 시그모이드 함수로 부드러운 긴급도 계산
        if days_left <= 0:
            time_pressure = 1.0
        else:
            # 1 / (1 + e^((days_left - typical_prep_days) / 7))
            x = (days_left - typical_prep_days) / 7.0
            time_pressure = 1 / (1 + np.exp(x))
        
        # 인기도와 우선순위 반영
        popularity = float(item.get('popularity_rate', 0.5))
        priority_factor = 1 - (int(item.get('priority_score', 5)) / 10)
        
        # 최종 긴급도
        urgency_score = (time_pressure * 0.6 + popularity * 0.3 + priority_factor * 0.1)
        
        # 레벨과 메시지
        if urgency_score > 0.8:
            level = "CRITICAL"
            message = "🚨 매우 급함! 지금 당장 처리하세요"
        elif urgency_score > 0.6:
            level = "HIGH"
            message = "⚠️ 서두르세요, 시간이 부족해요"
        elif urgency_score > 0.4:
            level = "MEDIUM"
            message = "📋 적당한 시기, 곧 준비하세요"
        else:
            level = "LOW"
            message = "😌 아직 여유가 있어요"
            
        return urgency_score, level, message
    
    def get_country_bonus(self, item: dict, country_code: str) -> tuple:
        """국가별 특수 보너스"""
        item_title = item.get('item_title', '').lower()
        
        country_bonuses = {
            'US': {'bonus': 0.2, 'keywords': ['f-1', 'sevis', 'i-20', 'ssn']},
            'JP': {'bonus': 0.15, 'keywords': ['재류카드', '국민건강보험', '일본어']},
            'DE': {'bonus': 0.15, 'keywords': ['anmeldung', 'blocked', '독일어']}
        }
        
        country_info = country_bonuses.get(country_code, {'bonus': 0, 'keywords': []})
        
        for keyword in country_info['keywords']:
            if keyword in item_title:
                return country_info['bonus'], f"🌍 {country_code} 필수 항목"
        
        return 0.0, "일반 항목"

# =============================================================================
# 데이터베이스 함수들
# =============================================================================
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.ping(reconnect=True, attempts=3, delay=1)
        return conn
    except mysql.connector.Error as e:
        print(f"DB 연결 오류: {e}")
        raise HTTPException(status_code=500, detail=f"DB 연결 실패: {str(e)}")

def get_popularity_stats(country_code: str, program_type_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT item_title, item_description, item_tag, popularity_rate, 
               avg_offset_days, priority_score
        FROM item_popularity_stats 
        WHERE country_code = %s AND program_type_id = %s
        ORDER BY popularity_rate DESC, priority_score ASC
        """
        cursor.execute(query, (country_code, program_type_id))
        return cursor.fetchall()
        
    finally:
        cursor.close()
        conn.close()

# =============================================================================
# 핵심 비즈니스 로직
# =============================================================================
def find_missing_items_advanced(existing_items: List[dict], popularity_data: List[dict], 
                               country_code: str, departure_date: str) -> List[dict]:
    """개선된 누락 항목 찾기 (사용자 유형 분류 없음)"""
    
    ai_engine = KoreanOptimizedAI()
    departure_dt = datetime.strptime(departure_date, "%Y-%m-%d")
    
    print(f"🧠 AI 분석 시작: {len(existing_items)}개 기존 vs {len(popularity_data)}개 인기 항목")
    
    # 1. 의미적 유사도로 새로운 항목 찾기
    novel_items = ai_engine.calculate_semantic_similarity(existing_items, popularity_data)
    
    # 2. 각 항목의 긴급도와 국가별 보너스 계산
    enhanced_items = []
    for item in novel_items:
        # 긴급도 계산
        urgency_score, urgency_level, urgency_message = ai_engine.calculate_dynamic_urgency(item, departure_dt)
        
        # 국가별 보너스
        country_bonus, country_reason = ai_engine.get_country_bonus(item, country_code)
        
        # 최종 추천 점수
        final_score = (
            float(item.get('popularity_rate', 0)) * 0.4 +  # 인기도 40%
            urgency_score * 0.4 +                          # 긴급도 40%
            country_bonus +                                 # 국가 보너스 +α
            (1 - int(item.get('priority_score', 5))/10) * 0.2  # 우선순위 20%
        )
        
        # 추천 이유 생성
        reasons = []
        if country_bonus > 0:
            reasons.append(country_reason)
        reasons.append(urgency_message)
        if item.get('popularity_rate', 0) > 0.8:
            reasons.append(f"🔥 {float(item['popularity_rate'])*100:.0f}%가 준비")
        
        enhanced_items.append({
            'item_title': item['item_title'],
            'item_description': item['item_description'],
            'item_tag': item['item_tag'],
            'popularity_rate': float(item['popularity_rate']),
            'avg_offset_days': item['avg_offset_days'],
            'priority_score': int(item['priority_score']),
            'missing_reason': ' | '.join(reasons),
            'confidence_score': final_score,
            'urgency_level': urgency_level
        })
    
    # 최종 점수로 정렬
    enhanced_items.sort(key=lambda x: x['confidence_score'], reverse=True)
    return enhanced_items[:5]

# =============================================================================
# API 엔드포인트
# =============================================================================
@app.get("/")
async def root():
    return {"message": "Day-0 AI Recommendation Service (Korean Optimized)", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return {"status": "healthy", "db": "connected", "ai": "korean_optimized"}
    except Exception as e:
        return {"status": "unhealthy", "db": "disconnected", "error": str(e)}

@app.post("/ai/recommendations/missing-items", response_model=MissingItemsResponse)
async def recommend_missing_items(request: MissingItemsRequest):
    """
    개선된 누락 항목 추천 API
    - 사용자 유형 분류 제거
    - 한국어 특화 텍스트 분석
    - 실용적 긴급도 계산
    """
    try:
        # 캐시 확인
        existing_items_dict = [item.model_dump() for item in request.existing_items]
        items_hash = hash_items(existing_items_dict)
        cache_key = get_cache_key("missing_v2", request.country_code, request.program_type_id, items_hash)
        
        cached_result = get_from_cache(cache_key, max_age_hours=2)
        if cached_result:
            return MissingItemsResponse(**cached_result)
        
        print(f"🤖 AI 분석 시작: {request.country_code} {request.program_type_id}")
        
        # 인기 통계 데이터 조회
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        if not popularity_data:
            return MissingItemsResponse(
                missing_items=[],
                total_missing=0,
                recommendation_summary="해당 국가/프로그램 데이터가 없습니다.",
                analysis_method="no_data"
            )
        
        # AI 분석 실행
        missing_items_data = find_missing_items_advanced(
            existing_items_dict, 
            popularity_data, 
            request.country_code,
            request.departure_date
        )
        
        # 응답 데이터 생성
        missing_items = [
            MissingItem(
                item_title=item['item_title'],
                item_description=item['item_description'],
                item_tag=item['item_tag'],
                popularity_rate=item['popularity_rate'],
                avg_offset_days=item['avg_offset_days'],
                priority_score=item['priority_score'],
                missing_reason=item['missing_reason'],
                confidence_score=item['confidence_score'],
                urgency_level=item['urgency_level']
            )
            for item in missing_items_data
        ]
        
        # 요약 메시지
        if len(missing_items) == 0:
            summary = "🎉 완벽합니다! 누락된 항목이 없어요."
            method = "semantic_analysis_complete"
        elif len(missing_items) <= 2:
            summary = f"💡 {len(missing_items)}개의 추가 항목을 확인해보세요."
            method = "semantic_analysis_minimal"
        else:
            critical_count = sum(1 for item in missing_items if item.urgency_level == "CRITICAL")
            if critical_count > 0:
                summary = f"🚨 {critical_count}개의 긴급 항목 포함, 총 {len(missing_items)}개 누락!"
                method = "semantic_analysis_critical"
            else:
                summary = f"📋 {len(missing_items)}개의 중요한 준비사항이 누락되었어요."
                method = "semantic_analysis_normal"
        
        result = MissingItemsResponse(
            missing_items=missing_items,
            total_missing=len(missing_items),
            recommendation_summary=summary,
            analysis_method=method
        )
        
        # 캐시 저장
        save_to_cache(cache_key, result.model_dump())
        
        return result
        
    except Exception as e:
        print(f"❌ AI 분석 오류: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 실패: {str(e)}")

@app.get("/cache/status")
async def cache_status():
    cache_info = {}
    for key, value in cache_dict.items():
        age = datetime.now() - value['created']
        cache_info[key] = {
            "age_minutes": int(age.total_seconds() / 60),
            "created": value['created'].strftime("%Y-%m-%d %H:%M:%S")
        }
    
    return {
        "total_cached_items": len(cache_dict),
        "cache_details": cache_info,
        "ai_version": "korean_optimized_v2"
    }

@app.delete("/cache/clear")
async def clear_all_cache():
    cleared_count = len(cache_dict)
    cache_dict.clear()
    return {"message": f"모든 캐시 삭제 완료: {cleared_count}개 항목"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
