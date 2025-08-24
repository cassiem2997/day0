# main.py - AI 추천 전용 FastAPI (통합 완성 버전)
# DB 스키마 호환성 + 메모리 캐싱 + is_fixed 필드 활용

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
# DB 설정 - Railway 우선, 로컬은 예외 처리
# =============================================================================
def get_db_config():
    """DB 설정을 동적으로 결정 - Railway 기본, 로컬 예외"""
    
    # 1. Railway 환경변수들 확인
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
    
    # 2. 대체: MYSQL_URL 방식
    mysql_url = os.getenv('MYSQL_URL')
    if mysql_url and mysql_url.startswith('mysql://'):
        print("🔗 MySQL URL 환경 감지")
        parsed = urlparse(mysql_url)
        return {
            'host': parsed.hostname,
            'port': parsed.port or 3306,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path[1:] if parsed.path else 'railway',
            'charset': 'utf8mb4'
        }
    
    # 3. 로컬 개발 환경
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

app = FastAPI(title="Day-0 AI Recommendation Service", version="1.0.0")

# =============================================================================
# 메모리 캐시 설정
# =============================================================================

# 간단한 메모리 캐시 딕셔너리
cache_dict = {}

def get_cache_key(endpoint: str, country_code: str, program_type_id: int, items_hash: str = ""):
    """캐시 키 생성"""
    if items_hash:
        return f"{endpoint}:{country_code}:{program_type_id}:{items_hash}"
    return f"{endpoint}:{country_code}:{program_type_id}"

def hash_items(items: List[dict]) -> str:
    """항목 리스트를 해시로 변환 (항목 변경 감지용)"""
    titles = sorted([item.get('title', '') for item in items])
    return hashlib.md5('|'.join(titles).encode()).hexdigest()[:8]

def get_from_cache(cache_key: str, max_age_hours: int = 1):
    """캐시에서 데이터 조회"""
    if cache_key in cache_dict:
        cache_entry = cache_dict[cache_key]
        age = datetime.now() - cache_entry['created']
        if age < timedelta(hours=max_age_hours):
            print(f"✅ 캐시 히트: {cache_key}")
            return cache_entry['data']
        else:
            # 만료된 캐시 삭제
            del cache_dict[cache_key]
            print(f"🕐 캐시 만료: {cache_key}")
    return None

def save_to_cache(cache_key: str, data: any):
    """캐시에 데이터 저장"""
    cache_dict[cache_key] = {
        'data': data,
        'created': datetime.now()
    }
    print(f"💾 캐시 저장: {cache_key}")

def clear_cache_pattern(pattern: str):
    """패턴에 맞는 캐시 삭제"""
    keys_to_delete = [k for k in cache_dict.keys() if pattern in k]
    for key in keys_to_delete:
        del cache_dict[key]
    print(f"🧹 캐시 삭제: {len(keys_to_delete)}개 항목")

# =============================================================================
# 데이터 모델 (DB 스키마 호환성 반영)
# =============================================================================

class ChecklistItem(BaseModel):
    """체크리스트 항목 모델"""
    title: str
    description: Optional[str] = ""
    tag: str = "NONE"
    status: str = "TODO"
    is_fixed: Optional[bool] = False  # 날짜 고정 여부 (D-30 등)

class MissingItemsRequest(BaseModel):
    """누락 항목 추천 요청"""
    existing_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str

class MissingItem(BaseModel):
    """누락 항목 응답"""
    item_title: str
    item_description: str
    item_tag: str
    popularity_rate: float
    avg_offset_days: int
    priority_score: int
    missing_reason: str
    confidence_score: float

class MissingItemsResponse(BaseModel):
    """누락 항목 추천 응답"""
    missing_items: List[MissingItem]
    total_missing: int
    recommendation_summary: str

class PriorityReorderRequest(BaseModel):
    """우선순위 재정렬 요청"""
    current_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str
    user_context: Optional[Dict[str, Any]] = {}

class PriorityItem(BaseModel):
    """우선순위가 조정된 항목"""
    title: str
    description: str
    tag: str
    original_priority: int
    ai_priority: int
    urgency_score: float
    reorder_reason: str
    is_fixed: bool = False  # 날짜 고정 여부 포함

class PriorityReorderResponse(BaseModel):
    """우선순위 재정렬 응답"""
    reordered_items: List[PriorityItem]
    total_reordered: int
    days_until_departure: int
    reorder_summary: str

# =============================================================================
# 의미적 유사성 기반 중복 제거 로직 
# =============================================================================

def extract_keywords(text):
    """텍스트에서 핵심 키워드 추출"""
    keywords = re.findall(r'[가-힣a-zA-Z]+', text.lower())
    stopwords = {'및', '등', '또는', '준비', '확인', '신청', '발급', '예약', 
                 'and', 'or', 'the', 'of', 'for', 'to', 'in', 'with'}
    keywords = [k for k in keywords if k not in stopwords and len(k) > 1]
    return set(keywords)

def is_semantically_similar(item1_title, item1_desc, item2_title, item2_desc, threshold=0.8):
    """정확한 중복만 판단 (과도한 중복 제거 방지)"""
    
    keywords1 = extract_keywords(f"{item1_title} {item1_desc}")
    keywords2 = extract_keywords(f"{item2_title} {item2_desc}")
    
    if len(keywords1) == 0 or len(keywords2) == 0:
        return False
    
    # Jaccard 유사도
    intersection = len(keywords1 & keywords2)
    union = len(keywords1 | keywords2)
    jaccard_score = intersection / union if union > 0 else 0
    
    return jaccard_score >= threshold

def remove_semantic_duplicates(base_items, candidate_items, similarity_threshold=0.8):
    """보수적인 중복 제거 (정확한 중복만)"""
    
    filtered_candidates = []
    
    for candidate in candidate_items:
        is_duplicate = False
        
        for base_item in base_items:
            if is_semantically_similar(
                base_item['title'], 
                base_item.get('description', ''),
                candidate['item_title'],
                candidate.get('item_description', ''),
                similarity_threshold
            ):
                print(f"정확한 중복 제거: '{candidate['item_title']}' ≈ '{base_item['title']}'")
                is_duplicate = True
                break
        
        if not is_duplicate:
            filtered_candidates.append(candidate)
    
    return filtered_candidates

# =============================================================================
# 데이터베이스 연결 및 조회 함수
# =============================================================================

def get_db_connection():
    """DB 연결 함수"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.ping(reconnect=True, attempts=3, delay=1)
        return conn
    except mysql.connector.Error as e:
        error_msg = str(e)
        print(f"DB 연결 오류: {error_msg}")
        raise HTTPException(status_code=500, detail=f"DB 연결 실패: {error_msg}")

def get_popularity_stats(country_code: str, program_type_id: int):
    """인기 통계 데이터 조회"""
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
# AI 추천 로직 (is_fixed 활용 강화)
# =============================================================================

def find_missing_items(existing_items: List[dict], popularity_data: List[dict]) -> List[dict]:
    """누락된 항목 찾기 - is_fixed 우선 고려"""
    
    # 기존 항목들의 제목 세트
    existing_titles = {item['title'].lower() for item in existing_items}
    
    missing_items = []
    for pop_item in popularity_data:
        item_title = pop_item['item_title'].lower()
        
        # 1. 정확한 제목 매칭으로 이미 있는지 확인
        if item_title in existing_titles:
            continue
            
        # 2. 의미적 유사성으로 이미 있는지 확인
        is_already_exists = False
        for existing_item in existing_items:
            if is_semantically_similar(
                existing_item['title'],
                existing_item.get('description', ''),
                pop_item['item_title'],
                pop_item.get('item_description', ''),
                threshold=0.7
            ):
                is_already_exists = True
                break
        
        if not is_already_exists:
            # Decimal을 float로 안전하게 변환
            popularity_rate = float(pop_item['popularity_rate']) if isinstance(pop_item['popularity_rate'], decimal.Decimal) else pop_item['popularity_rate']
            priority_score = float(pop_item['priority_score']) if isinstance(pop_item['priority_score'], decimal.Decimal) else pop_item['priority_score']
            
            # 누락 이유 판단
            if popularity_rate > 0.9:
                reason = f"필수 항목: {popularity_rate*100:.0f}%가 준비"
            elif priority_score <= 2:
                reason = "높은 우선순위 항목"
            elif popularity_rate > 0.8:
                reason = f"인기 항목: {popularity_rate*100:.0f}%가 준비"
            else:
                reason = "추천 항목"
            
            # 신뢰도 점수 계산
            confidence = popularity_rate * 0.7 + (1 - priority_score/10) * 0.3
            
            missing_items.append({
                'item_title': pop_item['item_title'],
                'item_description': pop_item['item_description'],
                'item_tag': pop_item['item_tag'],
                'popularity_rate': popularity_rate,
                'avg_offset_days': pop_item['avg_offset_days'],
                'priority_score': priority_score,
                'missing_reason': reason,
                'confidence_score': confidence
            })
    
    # 신뢰도 순으로 정렬
    missing_items.sort(key=lambda x: x['confidence_score'], reverse=True)
    return missing_items[:5]  # 상위 5개만

def calculate_priority_scores(items: List[dict], departure_date: str, popularity_data: List[dict]) -> List[dict]:
    """우선순위 점수 재계산 - is_fixed 필드 활용"""
    departure_dt = datetime.strptime(departure_date, "%Y-%m-%d")
    days_until = (departure_dt - datetime.now()).days
    
    # 인기 통계를 빠른 조회를 위해 딕셔너리로 변환
    popularity_dict = {stat['item_title']: stat for stat in popularity_data}
    
    reordered_items = []
    
    for i, item in enumerate(items):
        original_priority = i + 1
        is_fixed = item.get('is_fixed', False)
        
        # 인기 통계에서 해당 항목 찾기
        stat = popularity_dict.get(item['title'])
        
        if stat:
            # Decimal을 float로 안전하게 변환
            popularity_rate = float(stat['popularity_rate']) if isinstance(stat['popularity_rate'], decimal.Decimal) else stat['popularity_rate']
            
            # 긴급도 계산
            recommended_prep_day = abs(stat['avg_offset_days'])
            urgency_score = min(1.0, recommended_prep_day / max(1, days_until)) if days_until <= recommended_prep_day else 0.3
            
            # is_fixed 항목에 대한 가중치 추가
            fixed_bonus = 0.2 if is_fixed else 0.0
            
            # AI 우선순위 계산 (인기도 + 긴급도 + 고정 보너스)
            ai_priority_score = popularity_rate * 0.5 + urgency_score * 0.3 + fixed_bonus
            
            # 재정렬 이유
            if is_fixed and urgency_score > 0.5:
                reason = f"📅 고정 일정: D{stat['avg_offset_days']} 준비 필수"
            elif urgency_score > 0.7:
                reason = f"⚠️ 긴급: 출국까지 {days_until}일만 남음"
            elif popularity_rate > 0.9:
                reason = f"🔥 필수: {popularity_rate*100:.0f}%가 준비"
            elif is_fixed:
                reason = f"📌 날짜 고정 항목: D{stat['avg_offset_days']} 권장"
            elif urgency_score > 0.5:
                reason = f"⏰ 서둘러야 함: D{stat['avg_offset_days']} 권장"
            else:
                reason = "📝 일반 항목"
        else:
            # 통계가 없는 항목은 기본값
            urgency_score = 0.5
            fixed_bonus = 0.1 if is_fixed else 0.0
            ai_priority_score = 0.5 + fixed_bonus
            
            if is_fixed:
                reason = "📌 날짜 고정 항목"
            else:
                reason = "📝 일반 항목"
        
        reordered_items.append({
            'title': item['title'],
            'description': item.get('description', ''),
            'tag': item.get('tag', 'NONE'),
            'original_priority': original_priority,
            'ai_priority_score': ai_priority_score,
            'urgency_score': urgency_score,
            'reorder_reason': reason,
            'is_fixed': is_fixed
        })
    
    # AI 우선순위 점수로 정렬 (is_fixed 항목이 자연스럽게 상위로)
    reordered_items.sort(key=lambda x: x['ai_priority_score'], reverse=True)
    
    # 새로운 순서 번호 부여
    for i, item in enumerate(reordered_items):
        item['ai_priority'] = i + 1
    
    return reordered_items

# =============================================================================
# API 엔드포인트
# =============================================================================

@app.get("/")
async def root():
    """API 상태 확인"""
    return {"message": "Day-0 AI Recommendation Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """DB 연결 상태 확인"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "db": "disconnected", "error": str(e)}

@app.post("/ai/recommendations/missing-items", response_model=MissingItemsResponse)
async def recommend_missing_items(request: MissingItemsRequest):
    """
    누락 항목 추천 API (캐시 적용 + DB 호환성)
    
    Spring Boot에서 현재 체크리스트를 보내주면
    인기 통계 기반으로 누락된 항목들을 찾아서 추천
    """
    try:
        # 캐시 키 생성 (기존 항목 해시 포함)
        existing_items_dict = [item.model_dump() for item in request.existing_items]
        items_hash = hash_items(existing_items_dict)
        cache_key = get_cache_key("missing", request.country_code, request.program_type_id, items_hash)
        
        # 캐시 확인 (1시간 유효)
        cached_result = get_from_cache(cache_key, max_age_hours=1)
        if cached_result:
            return MissingItemsResponse(**cached_result)
        
        # 캐시 미스 - AI 분석 실행
        print(f"🤖 AI 분석 실행: missing-items")
        
        # 인기 통계 데이터 조회
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        
        # 누락된 항목 찾기
        missing_items_data = find_missing_items(existing_items_dict, popularity_data)
        
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
                confidence_score=item['confidence_score']
            )
            for item in missing_items_data
        ]
        
        # 요약 메시지
        if len(missing_items) == 0:
            summary = "🎉 완벽합니다! 누락된 항목이 없어요."
        elif len(missing_items) <= 2:
            summary = f"💡 {len(missing_items)}개의 항목을 추가로 확인해보세요."
        else:
            summary = f"⚠️ {len(missing_items)}개의 중요한 항목이 누락되었어요."
        
        result = MissingItemsResponse(
            missing_items=missing_items,
            total_missing=len(missing_items),
            recommendation_summary=summary
        )
        
        # 캐시에 저장
        save_to_cache(cache_key, result.model_dump())
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/recommendations/priority-reorder", response_model=PriorityReorderResponse)
async def reorder_priority(request: PriorityReorderRequest):
    """
    우선순위 재정렬 API (캐시 적용 + is_fixed 활용)
    
    현재 체크리스트의 항목들을 인기도와 긴급도, is_fixed 기반으로
    우선순위를 재정렬해서 추천
    """
    try:
        # 캐시 키 생성 (현재 항목 해시 + 출국날짜 포함)
        current_items_dict = [item.model_dump() for item in request.current_items]
        items_hash = hash_items(current_items_dict)
        departure_hash = hashlib.md5(request.departure_date.encode()).hexdigest()[:6]
        cache_key = get_cache_key("reorder", request.country_code, request.program_type_id, f"{items_hash}_{departure_hash}")
        
        # 캐시 확인 (6시간 유효 - 우선순위는 자주 안 바뀜)
        cached_result = get_from_cache(cache_key, max_age_hours=6)
        if cached_result:
            return PriorityReorderResponse(**cached_result)
        
        # 캐시 미스 - AI 분석 실행
        print(f"🤖 AI 분석 실행: priority-reorder")
        
        # 출국까지 남은 기간 계산
        departure_date = datetime.strptime(request.departure_date, "%Y-%m-%d")
        days_until = (departure_date - datetime.now()).days
        
        # 인기 통계 데이터 조회
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        
        # 우선순위 재계산 (is_fixed 고려)
        reordered_items_data = calculate_priority_scores(current_items_dict, request.departure_date, popularity_data)
        
        # 응답 데이터 생성
        reordered_items = [
            PriorityItem(
                title=item['title'],
                description=item['description'],
                tag=item['tag'],
                original_priority=item['original_priority'],
                ai_priority=item['ai_priority'],
                urgency_score=item['urgency_score'],
                reorder_reason=item['reorder_reason'],
                is_fixed=item['is_fixed']
            )
            for item in reordered_items_data
        ]
        
        # 요약 메시지
        fixed_count = sum(1 for item in reordered_items if item.is_fixed)
        if days_until <= 7:
            summary = f"⚠️ 출국 {days_until}일 전! 고정 일정 {fixed_count}개 우선 처리"
        elif days_until <= 30:
            summary = f"📋 출국 {days_until}일 전, 고정 항목 {fixed_count}개 먼저 확인"
        else:
            summary = f"📅 출국 {days_until}일 전, 여유롭게 준비 (고정 항목 {fixed_count}개)"
        
        result = PriorityReorderResponse(
            reordered_items=reordered_items,
            total_reordered=len(reordered_items),
            days_until_departure=days_until,
            reorder_summary=summary
        )
        
        # 캐시에 저장
        save_to_cache(cache_key, result.model_dump())
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cache/status")
async def cache_status():
    """캐시 상태 확인 (디버깅용)"""
    cache_info = {}
    for key, value in cache_dict.items():
        age = datetime.now() - value['created']
        cache_info[key] = {
            "age_minutes": int(age.total_seconds() / 60),
            "created": value['created'].strftime("%Y-%m-%d %H:%M:%S")
        }
    
    return {
        "total_cached_items": len(cache_dict),
        "cache_details": cache_info
    }

@app.delete("/cache/clear")
async def clear_all_cache():
    """모든 캐시 삭제 (디버깅용)"""
    cleared_count = len(cache_dict)
    cache_dict.clear()
    return {"message": f"모든 캐시 삭제 완료: {cleared_count}개 항목"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)