from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import mysql.connector
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os

app = FastAPI(title="Day-0 AI Checklist Generator", version="1.0.0")

# DB 연결 설정
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'day0_db'),
    'charset': 'utf8mb4'
}

# 요청/응답 모델
class ChecklistRequest(BaseModel):
    user_id: int
    departure_id: int
    country_code: str
    program_type_id: int
    start_date: str

class ChecklistItem(BaseModel):
    title: str
    description: str
    due_date: str
    tag: str
    default_amount: Optional[float]
    priority_score: int
    is_recommended: bool = False

class ChecklistResponse(BaseModel):
    user_checklist_id: int
    items: List[ChecklistItem]
    total_items: int
    ai_recommended_count: int

class AISuggestionsRequest(BaseModel):
    user_checklist_id: int
    country_code: str
    program_type_id: int
    departure_date: str
    current_checklist_items: Optional[List[str]] = []

class RecommendationItem(BaseModel):
    item_title: str
    item_description: str
    item_tag: str
    popularity_rate: float
    avg_offset_days: int
    priority_score: int
    urgency_score: float
    combined_score: float
    recommendation_reason: str

class AISuggestionsResponse(BaseModel):
    recommendations: List[RecommendationItem]
    total_count: int
    days_until_departure: int
    recommendation_summary: str

# DB 연결 함수
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# 기본 템플릿 조회
def get_base_template_items(country_code: str, program_type_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
        SELECT ct.template_id, cti.* FROM checklist_template ct
        JOIN checklist_template_item cti ON ct.template_id = cti.template_id
        WHERE ct.country_code = %s AND ct.program_type_id = %s
        ORDER BY cti.offset_days ASC
        """
        cursor.execute(query, (country_code, program_type_id))
        items = cursor.fetchall()
        
        if not items:
            query = """
            SELECT ct.template_id, cti.* FROM checklist_template ct
            JOIN checklist_template_item cti ON ct.template_id = cti.template_id
            WHERE ct.country_code IS NULL AND ct.program_type_id = %s
            ORDER BY cti.offset_days ASC
            """
            cursor.execute(query, (program_type_id,))
            items = cursor.fetchall()
            
        return items
        
    finally:
        cursor.close()
        conn.close()

# 인기 통계 데이터 조회
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

# TF-IDF 기반 추천
def generate_ai_recommendations(base_items: List[dict], popularity_data: List[dict]) -> List[dict]:
    if not popularity_data:
        return []
    
    base_titles = {item['title'] for item in base_items}
    candidate_items = [
        item for item in popularity_data 
        if item['item_title'] not in base_titles and item['popularity_rate'] >= 0.7
    ]
    
    if not candidate_items:
        return []
    
    # 간단한 TF-IDF 분석
    try:
        base_texts = [f"{item['title']} {item['description']}" for item in base_items]
        candidate_texts = [f"{item['item_title']} {item['item_description']}" for item in candidate_items]
        
        if len(base_texts) == 0:
            return candidate_items[:3]
        
        all_texts = base_texts + candidate_texts
        vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        
        base_vectors = tfidf_matrix[:len(base_texts)]
        candidate_vectors = tfidf_matrix[len(base_texts):]
        
        similarities = cosine_similarity(candidate_vectors, base_vectors)
        avg_similarities = similarities.mean(axis=1)
        
        recommendations = []
        for i, item in enumerate(candidate_items):
            similarity_score = avg_similarities[i]
            if 0.1 <= similarity_score <= 0.5:
                combined_score = similarity_score * 0.3 + item['popularity_rate'] * 0.7
                item['similarity_score'] = similarity_score
                recommendations.append(item)
        
        recommendations.sort(key=lambda x: x['popularity_rate'], reverse=True)
        return recommendations[:3]
        
    except Exception as e:
        print(f"TF-IDF 분석 오류: {e}")
        return sorted(candidate_items, key=lambda x: x['popularity_rate'], reverse=True)[:3]

# 체크리스트 DB 저장
def save_user_checklist(request: ChecklistRequest, items: List[ChecklistItem], template_id: Optional[int]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO user_checklist (user_id, departure_id, template_id, title, visibility)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            request.user_id,
            request.departure_id,
            template_id,
            f"{request.country_code} 교환학생 준비",
            'PUBLIC'
        ))
        
        user_checklist_id = cursor.lastrowid
        
        for item in items:
            cursor.execute("""
                INSERT INTO user_checklist_item 
                (user_checklist_id, title, description, due_date, tag, linked_amount, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                user_checklist_id,
                item.title,
                item.description,
                item.due_date,
                item.tag,
                item.default_amount,
                'TODO'
            ))
        
        conn.commit()
        return user_checklist_id
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# API 엔드포인트
@app.get("/")
async def root():
    return {"message": "Day-0 AI Checklist Generator API", "version": "1.0.0"}

@app.post("/api/checklist/generate", response_model=ChecklistResponse)
async def generate_checklist(request: ChecklistRequest):
    try:
        # 1. 기본 템플릿 조회
        base_items = get_base_template_items(request.country_code, request.program_type_id)
        template_id = base_items[0]['template_id'] if base_items else None
        
        # 2. AI 추천
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        ai_recommendations = generate_ai_recommendations(base_items, popularity_data)
        
        # 3. 체크리스트 아이템 생성
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        checklist_items = []
        
        # 기본 템플릿 항목들
        for item in base_items:
            due_date = start_date + timedelta(days=item['offset_days'])
            checklist_items.append(ChecklistItem(
                title=item['title'],
                description=item['description'],
                due_date=due_date.strftime("%Y-%m-%d"),
                tag=item['tag'],
                default_amount=item['default_amount'],
                priority_score=1,
                is_recommended=False
            ))
        
        # AI 추천 항목들
        for item in ai_recommendations:
            due_date = start_date + timedelta(days=item['avg_offset_days'])
            checklist_items.append(ChecklistItem(
                title=item['item_title'],
                description=item['item_description'],
                due_date=due_date.strftime("%Y-%m-%d"),
                tag=item['item_tag'],
                default_amount=30000.0,
                priority_score=item['priority_score'],
                is_recommended=True
            ))
        
        # 4. DB 저장
        user_checklist_id = save_user_checklist(request, checklist_items, template_id)
        
        return ChecklistResponse(
            user_checklist_id=user_checklist_id,
            items=sorted(checklist_items, key=lambda x: x.due_date),
            total_items=len(checklist_items),
            ai_recommended_count=len(ai_recommendations)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/ai-suggestions", response_model=AISuggestionsResponse)
async def get_ai_suggestions(request: AISuggestionsRequest):
    try:
        # 출국까지 남은 기간 계산
        departure_date = datetime.strptime(request.departure_date, "%Y-%m-%d")
        days_until = (departure_date - datetime.now()).days
        
        # 기본 추천 로직 (간단 버전)
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        
        recommendations = []
        for item in popularity_data[:5]:  # 상위 5개
            # 긴급도 계산
            recommended_prep_day = abs(item['avg_offset_days'])
            urgency_score = min(1.0, recommended_prep_day / max(1, days_until)) if days_until <= recommended_prep_day else 0.3
            
            # 종합 점수
            combined_score = item['popularity_rate'] * 0.4 + 0.5 * 0.3 + urgency_score * 0.3
            
            # 추천 이유
            if urgency_score > 0.7:
                reason = f"⚠️ 긴급: 출국까지 {days_until}일만 남음"
            elif item['popularity_rate'] > 0.8:
                reason = f"🔥 인기: {item['popularity_rate']*100:.0f}%가 준비"
            else:
                reason = "💡 추천 항목"
            
            recommendations.append(RecommendationItem(
                item_title=item['item_title'],
                item_description=item['item_description'],
                item_tag=item['item_tag'],
                popularity_rate=item['popularity_rate'],
                avg_offset_days=item['avg_offset_days'],
                priority_score=item['priority_score'],
                urgency_score=urgency_score,
                combined_score=combined_score,
                recommendation_reason=reason
            ))
        
        # 점수순 정렬
        recommendations.sort(key=lambda x: x.combined_score, reverse=True)
        
        # 요약 메시지
        if days_until <= 7:
            summary = f"⚠️ 출국 {days_until}일 전! 긴급 준비 필요"
        elif days_until <= 30:
            summary = f"📋 출국 {days_until}일 전, 중요 항목 확인"
        else:
            summary = f"📅 출국 {days_until}일 전, 여유롭게 준비"
        
        return AISuggestionsResponse(
            recommendations=recommendations,
            total_count=len(recommendations),
            days_until_departure=days_until,
            recommendation_summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)