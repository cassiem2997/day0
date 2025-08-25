# simplified_ai_engine.py - 순수 객관적 사실만 사용하는 AI 엔진
# 사용자 유형 분석 완전 제거, 오직 객관적 사실만 활용

from dotenv import load_dotenv
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum
import mysql.connector
import numpy as np
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
            'host': mysql_host, 'port': int(mysql_port) if mysql_port else 3306,
            'user': mysql_user, 'password': mysql_password or '',
            'database': mysql_database, 'charset': 'utf8mb4'
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
app = FastAPI(title="Day-0 Pure Objective AI", version="3.1.0")

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
    return None

def save_to_cache(cache_key: str, data: any):
    cache_dict[cache_key] = {'data': data, 'created': datetime.now()}

# =============================================================================
# 데이터 모델 (타입 안정성, 사용자 유형 제거)
# =============================================================================

class ChecklistStatus(str, Enum):
    TODO = "TODO"
    DOING = "DOING" 
    DONE = "DONE"
    SKIP = "SKIP"

class ChecklistTag(str, Enum):
    NONE = "NONE"
    SAVING = "SAVING"
    EXCHANGE = "EXCHANGE"
    INSURANCE = "INSURANCE"
    DOCUMENT = "DOCUMENT"
    ETC = "ETC"

class UrgencyLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class ChecklistItem(BaseModel):
    title: str
    description: Optional[str] = ""
    tag: ChecklistTag = ChecklistTag.NONE
    status: ChecklistStatus = ChecklistStatus.TODO
    is_fixed: bool = False

    class Config:
        use_enum_values = True

class MissingItemsRequest(BaseModel):
    existing_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str

class MissingItem(BaseModel):
    item_title: str
    item_description: str
    item_tag: ChecklistTag
    popularity_rate: float
    avg_offset_days: int
    priority_score: int
    urgency_level: UrgencyLevel
    urgency_reason: str
    confidence_score: float
    processing_time_days: int
    days_until_too_late: int  # 새로 추가: 언제까지 해야 하는지

class MissingItemsResponse(BaseModel):
    missing_items: List[MissingItem]
    total_missing: int
    recommendation_summary: str
    analysis_summary: str  # 사용자 유형 대신 객관적 분석 요약

class PriorityReorderRequest(BaseModel):
    current_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str

class PriorityItem(BaseModel):
    title: str
    description: str
    tag: ChecklistTag
    original_priority: int
    ai_priority: int
    urgency_score: float
    urgency_level: UrgencyLevel
    reorder_reason: str
    is_fixed: bool = False
    processing_time_days: int
    recommended_start_date: str  # 새로 추가: 언제 시작해야 하는지

class PriorityReorderResponse(BaseModel):
    reordered_items: List[PriorityItem]
    total_reordered: int
    days_until_departure: int
    reorder_summary: str
    critical_deadline_warning: Optional[str] = None  # 새로 추가: 마감일 경고

# =============================================================================
# 순수 객관적 사실 기반 시스템
# =============================================================================

class PureObjectiveSystem:
    """오직 객관적 사실만 사용하는 AI 시스템"""
    
    def __init__(self):
        # 실제 처리 시간 (통계 기반 객관적 사실)
        self.processing_times = {
            "비자": 21, "visa": 21, "f-1": 21, "학생비자": 21,
            "여권": 10, "passport": 10,
            "학교서류": 7, "university": 7, "입학허가서": 7,
            "장학금": 14, "scholarship": 14,
            "기숙사": 5, "dormitory": 5, "숙소": 5,
            "예방접종": 14, "vaccination": 14,
            "보험": 1, "insurance": 1,
            "환전": 1, "exchange": 1, "달러": 1, "엔화": 1, "유로": 1,
            "항공권": 1, "flight": 1,
            "짐": 1, "packing": 1
        }
        
        # 법적/제도적 마감일 (변경 불가능한 사실)
        self.absolute_deadlines = {
            "비자인터뷰": 30,     # 출국 30일 전 마감
            "예방접종": 14,       # 면역 형성을 위해 14일 전 마감
            "장학금": 60,         # 보통 2개월 전 마감
            "기숙사": 45,         # 보통 45일 전 마감
            "sevis": 30,
            "i-20": 45
        }
        
        # 의존성 체인 (A가 끝나야 B 시작 가능)
        self.dependency_chains = {
            "입학허가서": ["비자신청"],
            "비자신청": ["항공권예약", "보험가입"],
            "여권": ["비자신청", "항공권예약"]
        }

    def get_processing_time(self, title: str, tag: ChecklistTag) -> int:
        """실제 처리 시간 반환"""
        title_lower = title.lower()
        
        for keyword, days in self.processing_times.items():
            if keyword in title_lower:
                return days
        
        # 태그별 기본값
        defaults = {
            ChecklistTag.DOCUMENT: 7,
            ChecklistTag.INSURANCE: 1,
            ChecklistTag.EXCHANGE: 1,
            ChecklistTag.SAVING: 1,
            ChecklistTag.ETC: 3
        }
        return defaults.get(tag, 3)

    def get_absolute_deadline(self, title: str) -> Optional[int]:
        """절대 마감일 반환 (이 날 이후로는 불가능)"""
        title_lower = title.lower()
        
        for keyword, deadline_days in self.absolute_deadlines.items():
            if keyword.replace(" ", "") in title_lower.replace(" ", ""):
                return deadline_days
        
        return None

    def calculate_pure_urgency(self, title: str, tag: ChecklistTag, 
                              days_until_departure: int) -> tuple:
        """순수하게 객관적 사실만으로 긴급도 계산"""
        
        processing_days = self.get_processing_time(title, tag)
        absolute_deadline = self.get_absolute_deadline(title)
        
        # 실제 마감일 계산
        if absolute_deadline:
            # 절대 마감일이 있는 경우 (예: 비자는 30일 전까지 신청해야 함)
            real_deadline = absolute_deadline
        else:
            # 일반적인 경우 (처리 시간 + 안전 마진)
            real_deadline = processing_days + 3  # 3일 안전 마진
        
        days_until_too_late = real_deadline
        urgency_score = 0.0
        reasons = []
        
        # 긴급도 계산 (수학적)
        if days_until_departure <= 0:
            urgency_score = 1.0
            reasons.append("🚨 출국 임박!")
        elif days_until_departure <= real_deadline * 0.5:
            # 마감일의 50% 시점 = 매우 위험
            urgency_score = 0.9
            reasons.append(f"🔥 시간 매우 부족 ({processing_days}일 필요)")
        elif days_until_departure <= real_deadline:
            # 마감일까지 = 위험
            urgency_score = 0.7
            reasons.append(f"⚠️ 마감임박 ({processing_days}일 필요)")
        elif days_until_departure <= real_deadline * 1.5:
            # 마감일 1.5배까지 = 주의
            urgency_score = 0.5
            reasons.append(f"⏰ 여유 부족 ({processing_days}일 필요)")
        else:
            # 충분한 시간
            urgency_score = 0.2
            reasons.append("📅 충분한 시간")
        
        # 의존성 보너스
        if self._has_dependents(title):
            urgency_score += 0.1
            reasons.append("🔗 다른 항목 대기")
        
        urgency_score = min(1.0, urgency_score)
        
        # 레벨 결정
        if urgency_score >= 0.8:
            level = UrgencyLevel.CRITICAL
        elif urgency_score >= 0.6:
            level = UrgencyLevel.HIGH
        elif urgency_score >= 0.4:
            level = UrgencyLevel.MEDIUM
        else:
            level = UrgencyLevel.LOW
        
        return urgency_score, level, " | ".join(reasons), processing_days, days_until_too_late

    def _has_dependents(self, title: str) -> bool:
        """다른 항목이 이것에 의존하는지"""
        title_lower = title.lower()
        critical_items = ["비자", "여권", "입학허가서", "visa", "passport"]
        return any(item in title_lower for item in critical_items)

    def get_recommended_start_date(self, processing_days: int, days_until_departure: int) -> str:
        """권장 시작일 계산"""
        safety_margin = 3
        start_days_before = processing_days + safety_margin
        
        if days_until_departure > start_days_before:
            start_date = datetime.now() + timedelta(days=days_until_departure - start_days_before)
            return start_date.strftime("%Y-%m-%d")
        else:
            return "지금 즉시!"

    def analyze_preparation_status(self, existing_items: List[dict], days_until_departure: int) -> str:
        """준비 현황 객관적 분석"""
        if not existing_items:
            return f"출국 {days_until_departure}일 전, 준비 시작 필요"
        
        total_items = len(existing_items)
        completed_items = sum(1 for item in existing_items if item.get('status') == 'DONE')
        completion_rate = completed_items / total_items
        
        # 객관적 평가
        if completion_rate >= 0.8:
            return f"진행률 {completion_rate*100:.0f}% - 매우 잘 준비됨"
        elif completion_rate >= 0.6:
            return f"진행률 {completion_rate*100:.0f}% - 양호하게 진행 중"
        elif completion_rate >= 0.4:
            return f"진행률 {completion_rate*100:.0f}% - 더 집중 필요"
        elif days_until_departure <= 14:
            return f"진행률 {completion_rate*100:.0f}% - 출국 임박, 서둘러야 함"
        else:
            return f"진행률 {completion_rate*100:.0f}% - 계획적 준비 필요"

# =============================================================================
# DB 연결
# =============================================================================
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.ping(reconnect=True, attempts=3, delay=1)
        return conn
    except mysql.connector.Error as e:
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

def find_missing_items_pure(existing_items: List[dict], popularity_data: List[dict], 
                           country_code: str, departure_date: str) -> tuple:
    """순수 객관적 사실만으로 누락 항목 찾기"""
    
    system = PureObjectiveSystem()
    departure_dt = datetime.strptime(departure_date, "%Y-%m-%d")
    days_until = (departure_dt - datetime.now()).days
    
    # 기존 항목 제목들
    existing_titles = {item['title'].lower() for item in existing_items}
    
    missing_items = []
    for pop_item in popularity_data:
        # 이미 있는지 체크
        if pop_item['item_title'].lower() in existing_titles:
            continue
        
        # 의미적 중복 체크 (간단한 키워드 매칭)
        is_duplicate = any(
            len(set(pop_item['item_title'].lower().split()) & 
                set(existing['title'].lower().split())) >= 2
            for existing in existing_items
        )
        if is_duplicate:
            continue
        
        # 순수 객관적 긴급도 계산
        tag = ChecklistTag(pop_item['item_tag'])
        urgency_score, urgency_level, urgency_reason, processing_days, days_until_too_late = system.calculate_pure_urgency(
            pop_item['item_title'], tag, days_until
        )
        
        # 최종 신뢰도 (오직 객관적 요소만)
        popularity = float(pop_item['popularity_rate']) if isinstance(pop_item['popularity_rate'], decimal.Decimal) else pop_item['popularity_rate']
        priority_bonus = (1 - int(pop_item['priority_score'])/10) * 0.2
        
        confidence_score = urgency_score * 0.5 + popularity * 0.3 + priority_bonus
        
        missing_items.append({
            'item_title': pop_item['item_title'],
            'item_description': pop_item['item_description'],
            'item_tag': tag,
            'popularity_rate': popularity,
            'avg_offset_days': pop_item['avg_offset_days'],
            'priority_score': int(pop_item['priority_score']),
            'urgency_level': urgency_level,
            'urgency_reason': urgency_reason,
            'confidence_score': confidence_score,
            'processing_time_days': processing_days,
            'days_until_too_late': days_until_too_late
        })
    
    # 신뢰도 순 정렬
    missing_items.sort(key=lambda x: x['confidence_score'], reverse=True)
    
    # 객관적 분석 요약
    analysis_summary = system.analyze_preparation_status(existing_items, days_until)
    
    return missing_items[:5], analysis_summary

def reorder_priority_pure(items: List[dict], departure_date: str, popularity_data: List[dict]) -> tuple:
    """순수 객관적 사실만으로 우선순위 재정렬"""
    
    system = PureObjectiveSystem()
    departure_dt = datetime.strptime(departure_date, "%Y-%m-%d")
    days_until = (departure_dt - datetime.now()).days
    
    popularity_dict = {stat['item_title']: stat for stat in popularity_data}
    
    reordered_items = []
    critical_warnings = []
    
    for i, item in enumerate(items):
        tag = ChecklistTag(item.get('tag', 'NONE'))
        is_fixed = item.get('is_fixed', False)
        
        # 순수 객관적 긴급도
        urgency_score, urgency_level, urgency_reason, processing_days, days_until_too_late = system.calculate_pure_urgency(
            item['title'], tag, days_until
        )
        
        # 권장 시작일
        recommended_start_date = system.get_recommended_start_date(processing_days, days_until)
        
        # Critical 경고 수집
        if urgency_level == UrgencyLevel.CRITICAL:
            critical_warnings.append(f"'{item['title']}' - {urgency_reason}")
        
        # 최종 우선순위 점수 (순전히 객관적)
        stat = popularity_dict.get(item['title'])
        popularity_bonus = float(stat['popularity_rate']) * 0.2 if stat else 0.1
        fixed_bonus = 0.3 if is_fixed else 0.0
        
        final_priority_score = urgency_score + popularity_bonus + fixed_bonus
        
        reordered_items.append({
            'title': item['title'],
            'description': item.get('description', ''),
            'tag': tag,
            'original_priority': i + 1,
            'ai_priority_score': final_priority_score,
            'urgency_score': urgency_score,
            'urgency_level': urgency_level,
            'reorder_reason': urgency_reason + (" | 고정일정" if is_fixed else ""),
            'is_fixed': is_fixed,
            'processing_time_days': processing_days,
            'recommended_start_date': recommended_start_date
        })
    
    # 우선순위 점수로 정렬
    reordered_items.sort(key=lambda x: x['ai_priority_score'], reverse=True)
    
    # AI 우선순위 번호 부여
    for i, item in enumerate(reordered_items):
        item['ai_priority'] = i + 1
    
    # Critical 경고 메시지
    critical_warning = "; ".join(critical_warnings) if critical_warnings else None
    
    return reordered_items, critical_warning

# =============================================================================
# API 엔드포인트
# =============================================================================

@app.get("/")
async def root():
    return {
        "message": "Day-0 Pure Objective AI", 
        "version": "3.1.0", 
        "features": ["pure_objective_facts", "no_user_types", "processing_time_focus"]
    }

@app.get("/health")
async def health_check():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return {"status": "healthy", "db": "connected", "ai": "pure_objective"}
    except Exception as e:
        return {"status": "unhealthy", "db": "disconnected", "error": str(e)}

@app.post("/ai/recommendations/missing-items", response_model=MissingItemsResponse)
async def recommend_missing_items(request: MissingItemsRequest):
    """순수 객관적 사실 기반 누락 항목 추천"""
    try:
        existing_items_dict = [item.model_dump() for item in request.existing_items]
        items_hash = hash_items(existing_items_dict)
        cache_key = get_cache_key("missing_pure", request.country_code, request.program_type_id, items_hash)
        
        cached_result = get_from_cache(cache_key, max_age_hours=2)
        if cached_result:
            return MissingItemsResponse(**cached_result)
        
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        if not popularity_data:
            departure_dt = datetime.strptime(request.departure_date, "%Y-%m-%d")
            days_until = (departure_dt - datetime.now()).days
            
            return MissingItemsResponse(
                missing_items=[],
                total_missing=0,
                recommendation_summary="해당 국가/프로그램 데이터가 없습니다.",
                analysis_summary=f"출국 {days_until}일 전 준비 현황"
            )
        
        missing_items_data, analysis_summary = find_missing_items_pure(
            existing_items_dict, popularity_data, 
            request.country_code, request.departure_date
        )
        
        missing_items = [MissingItem(**item) for item in missing_items_data]
        
        # 요약 메시지
        if len(missing_items) == 0:
            summary = "🎉 모든 필수 항목이 준비되었습니다!"
        else:
            critical_count = sum(1 for item in missing_items if item.urgency_level == UrgencyLevel.CRITICAL)
            if critical_count > 0:
                summary = f"🚨 {critical_count}개 긴급 항목 발견! 즉시 처리 필요"
            else:
                summary = f"📋 {len(missing_items)}개 추천 항목 - 처리 시간을 고려해 준비하세요"
        
        result = MissingItemsResponse(
            missing_items=missing_items,
            total_missing=len(missing_items),
            recommendation_summary=summary,
            analysis_summary=analysis_summary
        )
        
        save_to_cache(cache_key, result.model_dump())
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/recommendations/priority-reorder", response_model=PriorityReorderResponse)
async def reorder_priority(request: PriorityReorderRequest):
    """순수 객관적 사실 기반 우선순위 재정렬"""
    try:
        current_items_dict = [item.model_dump() for item in request.current_items]
        items_hash = hash_items(current_items_dict)
        departure_hash = hashlib.md5(request.departure_date.encode()).hexdigest()[:6]
        cache_key = get_cache_key("reorder_pure", request.country_code, request.program_type_id, f"{items_hash}_{departure_hash}")
        
        cached_result = get_from_cache(cache_key, max_age_hours=6)
        if cached_result:
            return PriorityReorderResponse(**cached_result)
        
        departure_date = datetime.strptime(request.departure_date, "%Y-%m-%d")
        days_until = (departure_date - datetime.now()).days
        
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        
        reordered_items_data, critical_warning = reorder_priority_pure(
            current_items_dict, request.departure_date, popularity_data
        )
        
        reordered_items = [PriorityItem(**item) for item in reordered_items_data]
        
        # 요약 메시지
        critical_count = sum(1 for item in reordered_items if item.urgency_level == UrgencyLevel.CRITICAL)
        
        if critical_count > 0:
            summary = f"🚨 {critical_count}개 항목이 긴급 상태입니다"
        elif days_until <= 14:
            summary = f"⚠️ 출국 {days_until}일 전 - 처리 시간을 고려해 진행하세요"
        else:
            summary = f"📅 출국 {days_until}일 전 - 체계적으로 준비 가능"
        
        result = PriorityReorderResponse(
            reordered_items=reordered_items,
            total_reordered=len(reordered_items),
            days_until_departure=days_until,
            reorder_summary=summary,
            critical_deadline_warning=critical_warning
        )
        
        save_to_cache(cache_key, result.model_dump())
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
        "ai_version": "pure_objective_v3.1",
        "features": ["processing_time_focus", "deadline_warnings", "no_user_classification"]
    }

@app.delete("/cache/clear")
async def clear_all_cache():
    cleared_count = len(cache_dict)
    cache_dict.clear()
    return {"message": f"모든 캐시 삭제 완료: {cleared_count}개 항목"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
