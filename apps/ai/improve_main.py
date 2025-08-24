# main.py - ê°œì„ ëœ AI ì¶”ì²œ ì„œë¹„ìŠ¤ (ì‚¬ìš©ìž ìœ í˜• ë¶„ë¥˜ ì œê±°, í•œêµ­ì–´ ìµœì í™”)

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
# DB ì„¤ì •
# =============================================================================
def get_db_config():
    mysql_host = os.getenv('MYSQLHOST')
    mysql_port = os.getenv('MYSQLPORT')
    mysql_user = os.getenv('MYSQLUSER') 
    mysql_password = os.getenv('MYSQLPASSWORD')
    mysql_database = os.getenv('MYSQLDATABASE')
    
    if mysql_host and mysql_user and mysql_database:
        print("ðŸš„ Railway MySQL í™˜ê²½ ê°ì§€")
        return {
            'host': mysql_host,
            'port': int(mysql_port) if mysql_port else 3306,
            'user': mysql_user,
            'password': mysql_password or '',
            'database': mysql_database,
            'charset': 'utf8mb4'
        }
    
    print("ðŸ’» ë¡œì»¬ MySQL í™˜ê²½ìœ¼ë¡œ ì„¤ì •")
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
# ë©”ëª¨ë¦¬ ìºì‹œ
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
            print(f"âœ… ìºì‹œ ížˆíŠ¸: {cache_key}")
            return cache_entry['data']
        else:
            del cache_dict[cache_key]
            print(f"ðŸ—‚ ìºì‹œ ë§Œë£Œ: {cache_key}")
    return None

def save_to_cache(cache_key: str, data: any):
    cache_dict[cache_key] = {
        'data': data,
        'created': datetime.now()
    }
    print(f"ðŸ’¾ ìºì‹œ ì €ìž¥: {cache_key}")

# =============================================================================
# ë°ì´í„° ëª¨ë¸
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
# í•œêµ­ì–´ ìµœì í™” AI ì—”ì§„
# =============================================================================
class KoreanOptimizedAI:
    """í•œêµ­ì–´ ìµœì í™” AI ì¶”ì²œ ì—”ì§„ (ì‚¬ìš©ìž ìœ í˜• ë¶„ë¥˜ ì œê±°)"""
    
    def __init__(self):
        # í•œêµ­ì–´ ë¶ˆìš©ì–´ (ì˜ë¯¸ ì—†ëŠ” ë‹¨ì–´ë“¤)
        self.korean_stopwords = {
            'ê·¸ë¦¬ê³ ', 'ê·¸ëŸ¬ë‚˜', 'ê·¸ëŸ°ë°', 'ë˜í•œ', 'í•˜ì§€ë§Œ', 'ê·¸ëž˜ì„œ', 'ë”°ë¼ì„œ', 'ê·¸ëŸ°', 'ê·¸ëŸ¼',
            'ì¤€ë¹„', 'í™•ì¸', 'ì‹ ì²­', 'ë°œê¸‰', 'ì˜ˆì•½', 'ì™„ë£Œ', 'ë“±ë¡', 'ì œì¶œ', 'ì ‘ìˆ˜', 'ì²˜ë¦¬',
            'ì´', 'ê·¸', 'ì €', 'ê²ƒ', 'ë“¤', 'ìˆ˜', 'ìžˆ', 'ì—†', 'í•˜', 'ë˜', 'ë§', 'ì˜', 'ì„', 'ë¥¼',
            'ë•Œ', 'ê³³', 'ë”', 'ìž˜', 'ì¢€', 'ë§Ž', 'ì ', 'í¬', 'ìž‘', 'ê°™', 'ë‹¤ë¥¸', 'ìƒˆë¡œìš´',
            'í•´ì•¼', 'í•´ì•¼í•¨', 'í•„ìš”', 'ì¤‘ìš”', 'ê¼­', 'ë°˜ë“œì‹œ', 'ë¯¸ë¦¬', 'ë‚˜ì¤‘', 'ë¨¼ì €', 'ë‹¤ìŒ'
        }
        
        # êµ­ê°€ë³„ í•µì‹¬ í‚¤ì›Œë“œ
        self.country_keywords = {
            'US': ['f-1', 'sevis', 'i-20', 'ds-160', 'ì˜ì‚¬ê´€', 'ì¸í„°ë·°', 'ssn', 'ì†Œì…œì‹œíë¦¬í‹°'],
            'JP': ['ìž¬ë¥˜ì¹´ë“œ', 'êµ­ë¯¼ê±´ê°•ë³´í—˜', 'ê±°ì£¼ì§€ì‹ ê³ ', 'ì¼ë³¸ì–´', 'ì—”í™”'],
            'DE': ['anmeldung', 'ê±°ì£¼ì§€ë“±ë¡', 'blocked account', 'ë…ì¼ì–´', 'ìœ ë¡œ']
        }
        
    def extract_meaningful_keywords(self, text: str) -> set:
        """í•œêµ­ì–´ í…ìŠ¤íŠ¸ì—ì„œ ì˜ë¯¸ìžˆëŠ” í‚¤ì›Œë“œë§Œ ì¶”ì¶œ"""
        if not text:
            return set()
            
        # í•œê¸€, ì˜ë¬¸, ìˆ«ìž, í•˜ì´í”ˆë§Œ ë‚¨ê¸°ê¸°
        keywords = re.findall(r'[ê°€-íž£a-zA-Z0-9\-]+', text.lower())
        
        # ë¶ˆìš©ì–´ ì œê±° ë° 2ê¸€ìž ì´ìƒë§Œ
        meaningful_keywords = []
        for keyword in keywords:
            if (len(keyword) >= 2 and 
                keyword not in self.korean_stopwords and 
                not keyword.isdigit()):  # ìˆœìˆ˜ ìˆ«ìž ì œì™¸
                meaningful_keywords.append(keyword)
        
        return set(meaningful_keywords)
    
    def calculate_semantic_similarity(self, user_items: List[dict], popular_items: List[dict]) -> List[dict]:
        """ê°œì„ ëœ ì˜ë¯¸ì  ìœ ì‚¬ë„ ê³„ì‚° (í•œêµ­ì–´ íŠ¹í™”)"""
        
        if not user_items or not popular_items:
            return popular_items[:3]  # ì‚¬ìš©ìž ë°ì´í„° ì—†ìœ¼ë©´ ìƒìœ„ 3ê°œ ë°˜í™˜
        
        print(f"ðŸ” ì˜ë¯¸ì  ìœ ì‚¬ë„ ë¶„ì„: ì‚¬ìš©ìž {len(user_items)}ê°œ vs ì¸ê¸° {len(popular_items)}ê°œ í•­ëª©")
        
        # í…ìŠ¤íŠ¸ ì¤€ë¹„
        user_texts = []
        for item in user_items:
            text = f"{item['title']} {item.get('description', '')}"
            user_texts.append(text)
        
        popular_texts = []
        for item in popular_items:
            text = f"{item['item_title']} {item.get('item_description', '')}"
            popular_texts.append(text)
        
        try:
            # í•œêµ­ì–´ íŠ¹í™” TF-IDF ì„¤ì •
            vectorizer = TfidfVectorizer(
                max_features=30,           # í”¼ì²˜ ìˆ˜ ì¤„ìž„ (ì†ë„ í–¥ìƒ)
                ngram_range=(1, 2),        # 1-2 ê¸€ìž ì¡°í•©
                analyzer='char',           # ë¬¸ìž ë‹¨ìœ„ (í•œêµ­ì–´ì— íš¨ê³¼ì )
                min_df=1,                  # ìµœì†Œ 1ë²ˆì€ ë‚˜íƒ€ë‚˜ì•¼ í•¨
                lowercase=True
            )
            
            all_texts = user_texts + popular_texts
            if not all_texts or all(not text.strip() for text in all_texts):
                print("âš ï¸ í…ìŠ¤íŠ¸ ë°ì´í„° ë¶€ì¡± - í‚¤ì›Œë“œ ë°©ì‹ìœ¼ë¡œ í´ë°±")
                return self._fallback_keyword_analysis(user_items, popular_items)
            
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            
            # ë²¡í„° ë¶„ë¦¬
            user_vectors = tfidf_matrix[:len(user_texts)]
            popular_vectors = tfidf_matrix[len(user_texts):]
            
            # ì½”ì‚¬ì¸ ìœ ì‚¬ë„ ê³„ì‚°
            similarities = cosine_similarity(popular_vectors, user_vectors)
            
            # ìƒˆë¡œìš´ í•­ëª© ì°¾ê¸° (ìœ ì‚¬ë„ 0.25 ë¯¸ë§Œ)
            novel_items = []
            for i, popular_item in enumerate(popular_items):
                max_similarity = similarities[i].max() if similarities[i].size > 0 else 0
                
                if max_similarity < 0.25:  # 75% ì´ìƒ ë‹¤ë¥¸ í•­ëª©
                    novelty_score = 1 - max_similarity
                    novel_items.append({
                        **popular_item,
                        'semantic_novelty': novelty_score,
                        'similarity_analysis': f"ê¸°ì¡´ í•­ëª©ê³¼ {novelty_score*100:.0f}% ë‹¤ë¥¸ ìƒˆë¡œìš´ ì¤€ë¹„ì‚¬í•­"
                    })
                    print(f"âœ¨ ìƒˆë¡œìš´ í•­ëª© ë°œê²¬: {popular_item['item_title']} (ì°¨ì´ë„: {novelty_score:.2f})")
            
            # ì¸ê¸°ë„ ìˆœìœ¼ë¡œ ì •ë ¬í•˜ì—¬ ìƒìœ„ 5ê°œ
            novel_items.sort(key=lambda x: x['popularity_rate'], reverse=True)
            return novel_items[:5]
            
        except Exception as e:
            print(f"ðŸ”§ TF-IDF ë¶„ì„ ì‹¤íŒ¨ ({e}) - í‚¤ì›Œë“œ ë°©ì‹ìœ¼ë¡œ ì „í™˜")
            return self._fallback_keyword_analysis(user_items, popular_items)
    
    def _fallback_keyword_analysis(self, user_items: List[dict], popular_items: List[dict]) -> List[dict]:
        """í´ë°±: í‚¤ì›Œë“œ ê¸°ë°˜ ë¶„ì„"""
        # ì‚¬ìš©ìž í‚¤ì›Œë“œ ìˆ˜ì§‘
        user_keywords = set()
        for item in user_items:
            text = f"{item['title']} {item.get('description', '')}"
            user_keywords.update(self.extract_meaningful_keywords(text))
        
        print(f"ðŸ‘¤ ì‚¬ìš©ìž í‚¤ì›Œë“œ: {list(user_keywords)[:10]}...")  # ì²˜ìŒ 10ê°œë§Œ ì¶œë ¥
        
        # ê²¹ì¹˜ì§€ ì•ŠëŠ” í•­ëª© ì°¾ê¸°
        novel_items = []
        for popular_item in popular_items:
            pop_text = f"{popular_item['item_title']} {popular_item.get('item_description', '')}"
            pop_keywords = self.extract_meaningful_keywords(pop_text)
            
            # êµì§‘í•© ê³„ì‚°
            intersection = len(user_keywords & pop_keywords)
            union = len(user_keywords | pop_keywords)
            jaccard_score = intersection / union if union > 0 else 0
            
            if jaccard_score < 0.2:  # 80% ì´ìƒ ë‹¤ë¥´ë©´
                novel_items.append({
                    **popular_item,
                    'keyword_novelty': 1 - jaccard_score,
                    'similarity_analysis': f"í‚¤ì›Œë“œ ë¶„ì„: {(1-jaccard_score)*100:.0f}% ìƒˆë¡œìš´ í•­ëª©"
                })
        
        return novel_items[:5]
    
    def calculate_dynamic_urgency(self, item: dict, departure_date: datetime) -> tuple:
        """ìˆ˜í•™ì  ê¸´ê¸‰ë„ ê³„ì‚° (ì‹œê·¸ëª¨ì´ë“œ í•¨ìˆ˜)"""
        days_left = (departure_date - datetime.now()).days
        typical_prep_days = abs(item.get('avg_offset_days', 30))
        
        # ì‹œê·¸ëª¨ì´ë“œ í•¨ìˆ˜ë¡œ ë¶€ë“œëŸ¬ìš´ ê¸´ê¸‰ë„ ê³„ì‚°
        if days_left <= 0:
            time_pressure = 1.0
        else:
            # 1 / (1 + e^((days_left - typical_prep_days) / 7))
            x = (days_left - typical_prep_days) / 7.0
            time_pressure = 1 / (1 + np.exp(x))
        
        # ì¸ê¸°ë„ì™€ ìš°ì„ ìˆœìœ„ ë°˜ì˜
        popularity = float(item.get('popularity_rate', 0.5))
        priority_factor = 1 - (int(item.get('priority_score', 5)) / 10)
        
        # ìµœì¢… ê¸´ê¸‰ë„
        urgency_score = (time_pressure * 0.6 + popularity * 0.3 + priority_factor * 0.1)
        
        # ë ˆë²¨ê³¼ ë©”ì‹œì§€
        if urgency_score > 0.8:
            level = "CRITICAL"
            message = "ðŸš¨ ë§¤ìš° ê¸‰í•¨! ì§€ê¸ˆ ë‹¹ìž¥ ì²˜ë¦¬í•˜ì„¸ìš”"
        elif urgency_score > 0.6:
            level = "HIGH"
            message = "âš ï¸ ì„œë‘ë¥´ì„¸ìš”, ì‹œê°„ì´ ë¶€ì¡±í•´ìš”"
        elif urgency_score > 0.4:
            level = "MEDIUM"
            message = "ðŸ“‹ ì ë‹¹í•œ ì‹œê¸°, ê³§ ì¤€ë¹„í•˜ì„¸ìš”"
        else:
            level = "LOW"
            message = "ðŸ˜Œ ì•„ì§ ì—¬ìœ ê°€ ìžˆì–´ìš”"
            
        return urgency_score, level, message
    
    def get_country_bonus(self, item: dict, country_code: str) -> tuple:
        """êµ­ê°€ë³„ íŠ¹ìˆ˜ ë³´ë„ˆìŠ¤"""
        item_title = item.get('item_title', '').lower()
        
        country_bonuses = {
            'US': {'bonus': 0.2, 'keywords': ['f-1', 'sevis', 'i-20', 'ssn']},
            'JP': {'bonus': 0.15, 'keywords': ['ìž¬ë¥˜ì¹´ë“œ', 'êµ­ë¯¼ê±´ê°•ë³´í—˜', 'ì¼ë³¸ì–´']},
            'DE': {'bonus': 0.15, 'keywords': ['anmeldung', 'blocked', 'ë…ì¼ì–´']}
        }
        
        country_info = country_bonuses.get(country_code, {'bonus': 0, 'keywords': []})
        
        for keyword in country_info['keywords']:
            if keyword in item_title:
                return country_info['bonus'], f"ðŸŒ {country_code} í•„ìˆ˜ í•­ëª©"
        
        return 0.0, "ì¼ë°˜ í•­ëª©"

# =============================================================================
# ë°ì´í„°ë² ì´ìŠ¤ í•¨ìˆ˜ë“¤
# =============================================================================
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.ping(reconnect=True, attempts=3, delay=1)
        return conn
    except mysql.connector.Error as e:
        print(f"DB ì—°ê²° ì˜¤ë¥˜: {e}")
        raise HTTPException(status_code=500, detail=f"DB ì—°ê²° ì‹¤íŒ¨: {str(e)}")

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
# í•µì‹¬ ë¹„ì¦ˆë‹ˆìŠ¤ ë¡œì§
# =============================================================================
def find_missing_items_advanced(existing_items: List[dict], popularity_data: List[dict], 
                               country_code: str, departure_date: str) -> List[dict]:
    """ê°œì„ ëœ ëˆ„ë½ í•­ëª© ì°¾ê¸° (ì‚¬ìš©ìž ìœ í˜• ë¶„ë¥˜ ì—†ìŒ)"""
    
    ai_engine = KoreanOptimizedAI()
    departure_dt = datetime.strptime(departure_date, "%Y-%m-%d")
    
    print(f"ðŸ§  AI ë¶„ì„ ì‹œìž‘: {len(existing_items)}ê°œ ê¸°ì¡´ vs {len(popularity_data)}ê°œ ì¸ê¸° í•­ëª©")
    
    # 1. ì˜ë¯¸ì  ìœ ì‚¬ë„ë¡œ ìƒˆë¡œìš´ í•­ëª© ì°¾ê¸°
    novel_items = ai_engine.calculate_semantic_similarity(existing_items, popularity_data)
    
    # 2. ê° í•­ëª©ì˜ ê¸´ê¸‰ë„ì™€ êµ­ê°€ë³„ ë³´ë„ˆìŠ¤ ê³„ì‚°
    enhanced_items = []
    for item in novel_items:
        # ê¸´ê¸‰ë„ ê³„ì‚°
        urgency_score, urgency_level, urgency_message = ai_engine.calculate_dynamic_urgency(item, departure_dt)
        
        # êµ­ê°€ë³„ ë³´ë„ˆìŠ¤
        country_bonus, country_reason = ai_engine.get_country_bonus(item, country_code)
        
        # ìµœì¢… ì¶”ì²œ ì ìˆ˜
        final_score = (
            float(item.get('popularity_rate', 0)) * 0.4 +  # ì¸ê¸°ë„ 40%
            urgency_score * 0.4 +                          # ê¸´ê¸‰ë„ 40%
            country_bonus +                                 # êµ­ê°€ ë³´ë„ˆìŠ¤ +Î±
            (1 - int(item.get('priority_score', 5))/10) * 0.2  # ìš°ì„ ìˆœìœ„ 20%
        )
        
        # ì¶”ì²œ ì´ìœ  ìƒì„±
        reasons = []
        if country_bonus > 0:
            reasons.append(country_reason)
        reasons.append(urgency_message)
        if item.get('popularity_rate', 0) > 0.8:
            reasons.append(f"ðŸ”¥ {float(item['popularity_rate'])*100:.0f}%ê°€ ì¤€ë¹„")
        
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
    
    # ìµœì¢… ì ìˆ˜ë¡œ ì •ë ¬
    enhanced_items.sort(key=lambda x: x['confidence_score'], reverse=True)
    return enhanced_items[:5]

# =============================================================================
# API ì—”ë“œí¬ì¸íŠ¸
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
    ê°œì„ ëœ ëˆ„ë½ í•­ëª© ì¶”ì²œ API
    - ì‚¬ìš©ìž ìœ í˜• ë¶„ë¥˜ ì œê±°
    - í•œêµ­ì–´ íŠ¹í™” í…ìŠ¤íŠ¸ ë¶„ì„
    - ì‹¤ìš©ì  ê¸´ê¸‰ë„ ê³„ì‚°
    """
    try:
        # ìºì‹œ í™•ì¸
        existing_items_dict = [item.model_dump() for item in request.existing_items]
        items_hash = hash_items(existing_items_dict)
        cache_key = get_cache_key("missing_v2", request.country_code, request.program_type_id, items_hash)
        
        cached_result = get_from_cache(cache_key, max_age_hours=2)
        if cached_result:
            return MissingItemsResponse(**cached_result)
        
        print(f"ðŸ¤– AI ë¶„ì„ ì‹œìž‘: {request.country_code} {request.program_type_id}")
        
        # ì¸ê¸° í†µê³„ ë°ì´í„° ì¡°íšŒ
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        if not popularity_data:
            return MissingItemsResponse(
                missing_items=[],
                total_missing=0,
                recommendation_summary="í•´ë‹¹ êµ­ê°€/í”„ë¡œê·¸ëž¨ ë°ì´í„°ê°€ ì—†ìŠµë‹ˆë‹¤.",
                analysis_method="no_data"
            )
        
        # AI ë¶„ì„ ì‹¤í–‰
        missing_items_data = find_missing_items_advanced(
            existing_items_dict, 
            popularity_data, 
            request.country_code,
            request.departure_date
        )
        
        # ì‘ë‹µ ë°ì´í„° ìƒì„±
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
        
        # ìš”ì•½ ë©”ì‹œì§€
        if len(missing_items) == 0:
            summary = "ðŸŽ‰ ì™„ë²½í•©ë‹ˆë‹¤! ëˆ„ë½ëœ í•­ëª©ì´ ì—†ì–´ìš”."
            method = "semantic_analysis_complete"
        elif len(missing_items) <= 2:
            summary = f"ðŸ’¡ {len(missing_items)}ê°œì˜ ì¶”ê°€ í•­ëª©ì„ í™•ì¸í•´ë³´ì„¸ìš”."
            method = "semantic_analysis_minimal"
        else:
            critical_count = sum(1 for item in missing_items if item.urgency_level == "CRITICAL")
            if critical_count > 0:
                summary = f"ðŸš¨ {critical_count}ê°œì˜ ê¸´ê¸‰ í•­ëª© í¬í•¨, ì´ {len(missing_items)}ê°œ ëˆ„ë½!"
                method = "semantic_analysis_critical"
            else:
                summary = f"ðŸ“‹ {len(missing_items)}ê°œì˜ ì¤‘ìš”í•œ ì¤€ë¹„ì‚¬í•­ì´ ëˆ„ë½ë˜ì—ˆì–´ìš”."
                method = "semantic_analysis_normal"
        
        result = MissingItemsResponse(
            missing_items=missing_items,
            total_missing=len(missing_items),
            recommendation_summary=summary,
            analysis_method=method
        )
        
        # ìºì‹œ ì €ìž¥
        save_to_cache(cache_key, result.model_dump())
        
        return result
        
    except Exception as e:
        print(f"âŒ AI ë¶„ì„ ì˜¤ë¥˜: {e}")
        raise HTTPException(status_code=500, detail=f"AI ë¶„ì„ ì‹¤íŒ¨: {str(e)}")

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
    return {"message": f"ëª¨ë“  ìºì‹œ ì‚­ì œ ì™„ë£Œ: {cleared_count}ê°œ í•­ëª©"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)