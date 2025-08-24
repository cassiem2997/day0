# main.py - AI ì¶”ì²œ ì „ìš© FastAPI (ìµœì¢… ê³ ë„í™” ë²„ì „)
# DB ìŠ¤í‚¤ë§ˆ í˜¸í™˜ì„± + ë©”ëª¨ë¦¬ ìºì‹± + is_fixed í•„ë“œ í™œìš© + ê³ ê¸‰ ML ê¸°ëŠ¥

from dotenv import load_dotenv
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import mysql.connector
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA, LatentDirichletAllocation
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import os
import re
import decimal  
import hashlib

load_dotenv()

# =============================================================================
# DB ì„¤ì • - Railway ìš°ì„ , ë¡œì»¬ì€ ì˜ˆì™¸ ì²˜ë¦¬
# =============================================================================
def get_db_config():
    """DB ì„¤ì •ì„ ë™ì ìœ¼ë¡œ ê²°ì • - Railway ê¸°ë³¸, ë¡œì»¬ ì˜ˆì™¸"""
    
    # 1. Railway í™˜ê²½ë³€ìˆ˜ë“¤ í™•ì¸
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
    
    # 2. ëŒ€ì²´: MYSQL_URL ë°©ì‹
    mysql_url = os.getenv('MYSQL_URL')
    if mysql_url and mysql_url.startswith('mysql://'):
        print("ðŸ”— MySQL URL í™˜ê²½ ê°ì§€")
        parsed = urlparse(mysql_url)
        return {
            'host': parsed.hostname,
            'port': parsed.port or 3306,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path[1:] if parsed.path else 'railway',
            'charset': 'utf8mb4'
        }
    
    # 3. ë¡œì»¬ ê°œë°œ í™˜ê²½
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

app = FastAPI(title="Day-0 AI Recommendation Service", version="1.0.0")

# =============================================================================
# ë©”ëª¨ë¦¬ ìºì‹œ ì„¤ì •
# =============================================================================

# ê°„ë‹¨í•œ ë©”ëª¨ë¦¬ ìºì‹œ ë”•ì…”ë„ˆë¦¬
cache_dict = {}

def get_cache_key(endpoint: str, country_code: str, program_type_id: int, items_hash: str = ""):
    """ìºì‹œ í‚¤ ìƒì„±"""
    if items_hash:
        return f"{endpoint}:{country_code}:{program_type_id}:{items_hash}"
    return f"{endpoint}:{country_code}:{program_type_id}"

def hash_items(items: List[dict]) -> str:
    """í•­ëª© ë¦¬ìŠ¤íŠ¸ë¥¼ í•´ì‹œë¡œ ë³€í™˜ (í•­ëª© ë³€ê²½ ê°ì§€ìš©)"""
    titles = sorted([item.get('title', '') for item in items])
    return hashlib.md5('|'.join(titles).encode()).hexdigest()[:8]

def get_from_cache(cache_key: str, max_age_hours: int = 1):
    """ìºì‹œì—ì„œ ë°ì´í„° ì¡°íšŒ"""
    if cache_key in cache_dict:
        cache_entry = cache_dict[cache_key]
        age = datetime.now() - cache_entry['created']
        if age < timedelta(hours=max_age_hours):
            print(f"âœ… ìºì‹œ ížˆíŠ¸: {cache_key}")
            return cache_entry['data']
        else:
            # ë§Œë£Œëœ ìºì‹œ ì‚­ì œ
            del cache_dict[cache_key]
            print(f"ðŸ• ìºì‹œ ë§Œë£Œ: {cache_key}")
    return None

def save_to_cache(cache_key: str, data: any):
    """ìºì‹œì— ë°ì´í„° ì €ìž¥"""
    cache_dict[cache_key] = {
        'data': data,
        'created': datetime.now()
    }
    print(f"ðŸ’¾ ìºì‹œ ì €ìž¥: {cache_key}")

def clear_cache_pattern(pattern: str):
    """íŒ¨í„´ì— ë§žëŠ” ìºì‹œ ì‚­ì œ"""
    keys_to_delete = [k for k in cache_dict.keys() if pattern in k]
    for key in keys_to_delete:
        del cache_dict[key]
    print(f"ðŸ§¹ ìºì‹œ ì‚­ì œ: {len(keys_to_delete)}ê°œ í•­ëª©")

# =============================================================================
# ë°ì´í„° ëª¨ë¸ (DB ìŠ¤í‚¤ë§ˆ í˜¸í™˜ì„± ë°˜ì˜)
# =============================================================================

class ChecklistItem(BaseModel):
    """ì²´í¬ë¦¬ìŠ¤íŠ¸ í•­ëª© ëª¨ë¸"""
    title: str
    description: Optional[str] = ""
    tag: str = "NONE"
    status: str = "TODO"
    is_fixed: Optional[bool] = False  # ë‚ ì§œ ê³ ì • ì—¬ë¶€ (D-30 ë“±)

class MissingItemsRequest(BaseModel):
    """ëˆ„ë½ í•­ëª© ì¶”ì²œ ìš”ì²­"""
    existing_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str

class MissingItem(BaseModel):
    """ëˆ„ë½ í•­ëª© ì‘ë‹µ"""
    item_title: str
    item_description: str
    item_tag: str
    popularity_rate: float
    avg_offset_days: int
    priority_score: int
    missing_reason: str
    confidence_score: float

class MissingItemsResponse(BaseModel):
    """ëˆ„ë½ í•­ëª© ì¶”ì²œ ì‘ë‹µ"""
    missing_items: List[MissingItem]
    total_missing: int
    recommendation_summary: str

class PriorityReorderRequest(BaseModel):
    """ìš°ì„ ìˆœìœ„ ìž¬ì •ë ¬ ìš”ì²­"""
    current_items: List[ChecklistItem]
    country_code: str
    program_type_id: int
    departure_date: str
    user_context: Optional[Dict[str, Any]] = {}

class PriorityItem(BaseModel):
    """ìš°ì„ ìˆœìœ„ê°€ ì¡°ì •ëœ í•­ëª©"""
    title: str
    description: str
    tag: str
    original_priority: int
    ai_priority: int
    urgency_score: float
    reorder_reason: str
    is_fixed: bool = False  # ë‚ ì§œ ê³ ì • ì—¬ë¶€ í¬í•¨

class PriorityReorderResponse(BaseModel):
    """ìš°ì„ ìˆœìœ„ ìž¬ì •ë ¬ ì‘ë‹µ"""
    reordered_items: List[PriorityItem]
    total_reordered: int
    days_until_departure: int
    reorder_summary: str

# =============================================================================
# ì˜ë¯¸ì  ìœ ì‚¬ì„± ê¸°ë°˜ ì¤‘ë³µ ì œê±° ë¡œì§ 
# =============================================================================

def extract_keywords(text):
    """í…ìŠ¤íŠ¸ì—ì„œ í•µì‹¬ í‚¤ì›Œë“œ ì¶”ì¶œ"""
    keywords = re.findall(r'[ê°€-íž£a-zA-Z]+', text.lower())
    stopwords = {'ë°', 'ë“±', 'ë˜ëŠ”', 'ì¤€ë¹„', 'í™•ì¸', 'ì‹ ì²­', 'ë°œê¸‰', 'ì˜ˆì•½', 
                 'and', 'or', 'the', 'of', 'for', 'to', 'in', 'with'}
    keywords = [k for k in keywords if k not in stopwords and len(k) > 1]
    return set(keywords)

def is_semantically_similar(item1_title, item1_desc, item2_title, item2_desc, threshold=0.8):
    """ì •í™•í•œ ì¤‘ë³µë§Œ íŒë‹¨ (ê³¼ë„í•œ ì¤‘ë³µ ì œê±° ë°©ì§€)"""
    
    keywords1 = extract_keywords(f"{item1_title} {item1_desc}")
    keywords2 = extract_keywords(f"{item2_title} {item2_desc}")
    
    if len(keywords1) == 0 or len(keywords2) == 0:
        return False
    
    # Jaccard ìœ ì‚¬ë„
    intersection = len(keywords1 & keywords2)
    union = len(keywords1 | keywords2)
    jaccard_score = intersection / union if union > 0 else 0
    
    return jaccard_score >= threshold

def remove_semantic_duplicates(base_items, candidate_items, similarity_threshold=0.8):
    """ë³´ìˆ˜ì ì¸ ì¤‘ë³µ ì œê±° (ì •í™•í•œ ì¤‘ë³µë§Œ)"""
    
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
                print(f"ì •í™•í•œ ì¤‘ë³µ ì œê±°: '{candidate['item_title']}' â‰ˆ '{base_item['title']}'")
                is_duplicate = True
                break
        
        if not is_duplicate:
            filtered_candidates.append(candidate)
    
    return filtered_candidates

# =============================================================================
# ë°ì´í„°ë² ì´ìŠ¤ ì—°ê²° ë° ì¡°íšŒ í•¨ìˆ˜
# =============================================================================

def get_db_connection():
    """DB ì—°ê²° í•¨ìˆ˜"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        conn.ping(reconnect=True, attempts=3, delay=1)
        return conn
    except mysql.connector.Error as e:
        error_msg = str(e)
        print(f"DB ì—°ê²° ì˜¤ë¥˜: {error_msg}")
        raise HTTPException(status_code=500, detail=f"DB ì—°ê²° ì‹¤íŒ¨: {error_msg}")

def get_popularity_stats(country_code: str, program_type_id: int):
    """ì¸ê¸° í†µê³„ ë°ì´í„° ì¡°íšŒ"""
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
# ê³ ê¸‰ AI ì¶”ì²œ í´ëž˜ìŠ¤ë“¤ (ìƒˆë¡œ ì¶”ê°€)
# =============================================================================

class AdvancedAIEngine:
    """ê³ ë„í™”ëœ AI ì¶”ì²œ ì—”ì§„"""
    
    def __init__(self):
        self.user_type_labels = {
            0: "ì™„ë²½ì£¼ì˜ìž",
            1: "ê³„íší˜•", 
            2: "ë§‰íŒìŠ¤íŒŒíŠ¸",
            3: "ì‹ ì¤‘í˜•",
            4: "ì‹¤ìš©ì£¼ì˜ìž"
        }
        
    def analyze_user_behavior(self, existing_items: List[dict]) -> Dict[str, float]:
        """ì‚¬ìš©ìž í–‰ë™ íŒ¨í„´ ë¶„ì„"""
        
        if not existing_items:
            return {
                'completion_rate': 0.5,
                'document_focus': 0.3,
                'financial_focus': 0.3,
                'insurance_focus': 0.2,
                'planning_score': 0.5
            }
        
        total_items = len(existing_items)
        completed_items = sum(1 for item in existing_items if item.get('status') == 'DONE')
        
        # íƒœê·¸ë³„ ë¹„ìœ¨ ê³„ì‚°
        tag_counts = {}
        for item in existing_items:
            tag = item.get('tag', 'ETC')
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        return {
            'completion_rate': completed_items / total_items if total_items > 0 else 0.5,
            'document_focus': tag_counts.get('DOCUMENT', 0) / total_items if total_items > 0 else 0.3,
            'financial_focus': tag_counts.get('EXCHANGE', 0) / total_items if total_items > 0 else 0.3,
            'insurance_focus': tag_counts.get('INSURANCE', 0) / total_items if total_items > 0 else 0.2,
            'planning_score': min(1.0, total_items / 10.0)  # í•­ëª© ë§Žì„ìˆ˜ë¡ ê³„íšì 
        }
    
    def create_user_vector(self, items: List[dict], behavior: Dict[str, float]) -> np.ndarray:
        """ì‚¬ìš©ìž íŠ¹ì„± ë²¡í„° ìƒì„±"""
        
        # í…ìŠ¤íŠ¸ íŠ¹ì„± (ê°„ë‹¨í•œ TF-IDF)
        texts = [f"{item['title']} {item.get('description', '')}" for item in items]
        if texts:
            vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
            try:
                tfidf_matrix = vectorizer.fit_transform(texts)
                text_features = tfidf_matrix.mean(axis=0).A1
            except:
                text_features = np.zeros(10)
        else:
            text_features = np.zeros(10)
        
        # í–‰ë™ íŠ¹ì„±
        behavior_features = np.array([
            behavior['completion_rate'],
            behavior['document_focus'],
            behavior['financial_focus'],
            behavior['insurance_focus'],
            behavior['planning_score']
        ])
        
        # ë²¡í„° ê²°í•©
        if len(text_features) < 10:
            text_features = np.pad(text_features, (0, 10 - len(text_features)))
        
        return np.concatenate([text_features[:10], behavior_features])
    
    def predict_user_type(self, user_vector: np.ndarray) -> tuple:
        """ì‚¬ìš©ìž ìœ í˜• ì˜ˆì¸¡ (ê°„ë‹¨í•œ ê·œì¹™ ê¸°ë°˜)"""
        
        completion_rate = user_vector[10]
        document_focus = user_vector[11]
        planning_score = user_vector[14]
        
        # ê°„ë‹¨í•œ ê·œì¹™ ê¸°ë°˜ ë¶„ë¥˜
        if completion_rate > 0.8 and document_focus > 0.5:
            return 0, "ì™„ë²½ì£¼ì˜ìž", 0.9
        elif planning_score > 0.7:
            return 1, "ê³„íší˜•", 0.8
        elif completion_rate < 0.3:
            return 2, "ë§‰íŒìŠ¤íŒŒíŠ¸", 0.7
        elif document_focus > 0.4:
            return 3, "ì‹ ì¤‘í˜•", 0.8
        else:
            return 4, "ì‹¤ìš©ì£¼ì˜ìž", 0.6
    
    def calculate_advanced_scores(self, 
                                 candidate_items: List[dict], 
                                 user_type: int,
                                 user_vector: np.ndarray) -> List[dict]:
        """ê³ ê¸‰ ì ìˆ˜ ê³„ì‚°"""
        
        # ìœ í˜•ë³„ ê°€ì¤‘ì¹˜
        type_weights = {
            0: {'DOCUMENT': 0.3, 'INSURANCE': 0.2, 'ETC': 0.1},  # ì™„ë²½ì£¼ì˜ìž
            1: {'DOCUMENT': 0.2, 'INSURANCE': 0.15, 'EXCHANGE': 0.15},  # ê³„íší˜•
            2: {'EXCHANGE': 0.25, 'ETC': 0.2, 'DOCUMENT': 0.1},  # ë§‰íŒìŠ¤íŒŒíŠ¸
            3: {'INSURANCE': 0.3, 'DOCUMENT': 0.25, 'ETC': 0.1},  # ì‹ ì¤‘í˜•
            4: {'EXCHANGE': 0.2, 'ETC': 0.15, 'DOCUMENT': 0.1}   # ì‹¤ìš©ì£¼ì˜ìž
        }
        
        weights = type_weights.get(user_type, type_weights[1])
        
        enhanced_items = []
        for item in candidate_items:
            # ê¸°ë³¸ ì ìˆ˜
            base_score = float(item['popularity_rate']) if isinstance(item['popularity_rate'], decimal.Decimal) else item['popularity_rate']
            
            # ìœ í˜•ë³„ ë³´ë„ˆìŠ¤
            type_bonus = weights.get(item['item_tag'], 0.0)
            
            # ìš°ì„ ìˆœìœ„ ë³´ë„ˆìŠ¤
            priority_bonus = (1.0 - float(item['priority_score']) / 10.0) * 0.2
            
            # ìµœì¢… ì ìˆ˜
            final_score = base_score * 0.5 + type_bonus + priority_bonus
            
            # ì¶”ì²œ ì´ìœ  ìƒì„±
            if type_bonus > 0.15:
                reason = f"ðŸŽ¯ {self.user_type_labels[user_type]} ìœ í˜•ì—ê²Œ ì¶”ì²œ"
            elif base_score > 0.9:
                reason = f"ðŸ”¥ í•„ìˆ˜: {base_score*100:.0f}%ê°€ ì¤€ë¹„"
            elif priority_bonus > 0.15:
                reason = "â­ ë†’ì€ ìš°ì„ ìˆœìœ„ í•­ëª©"
            else:
                reason = "ðŸ“Š ì¼ë°˜ ì¶”ì²œ"
            
            enhanced_items.append({
                **item,
                'ai_advanced_score': final_score,
                'user_type': self.user_type_labels[user_type],
                'type_bonus': type_bonus,
                'recommendation_reason': reason
            })
        
        # ê³ ê¸‰ ì ìˆ˜ë¡œ ì •ë ¬
        enhanced_items.sort(key=lambda x: x['ai_advanced_score'], reverse=True)
        return enhanced_items

def find_missing_items(existing_items: List[dict], popularity_data: List[dict]) -> List[dict]:
    """ëˆ„ë½ëœ í•­ëª© ì°¾ê¸° - ê³ ê¸‰ AI ë¶„ì„ ì ìš©"""
    
    # ê³ ê¸‰ AI ì—”ì§„ ì´ˆê¸°í™”
    ai_engine = AdvancedAIEngine()
    
    # ì‚¬ìš©ìž í–‰ë™ íŒ¨í„´ ë¶„ì„
    user_behavior = ai_engine.analyze_user_behavior(existing_items)
    print(f"ðŸ§  ì‚¬ìš©ìž í–‰ë™ ë¶„ì„: ì™„ë£Œìœ¨ {user_behavior['completion_rate']:.2f}, ê³„íšì„± {user_behavior['planning_score']:.2f}")
    
    # ì‚¬ìš©ìž ë²¡í„° ìƒì„±
    user_vector = ai_engine.create_user_vector(existing_items, user_behavior)
    
    # ì‚¬ìš©ìž ìœ í˜• ì˜ˆì¸¡
    user_type, type_name, confidence = ai_engine.predict_user_type(user_vector)
    print(f"ðŸŽ¯ ì‚¬ìš©ìž ìœ í˜•: {type_name} (ì‹ ë¢°ë„: {confidence:.2f})")
    
    # ê¸°ì¡´ í•­ëª©ë“¤ì˜ ì œëª© ì„¸íŠ¸
    existing_titles = {item['title'].lower() for item in existing_items}
    
    # í›„ë³´ í•­ëª© í•„í„°ë§
    candidate_items = []
    for pop_item in popularity_data:
        item_title = pop_item['item_title'].lower()
        
        # 1. ì •í™•í•œ ì œëª© ë§¤ì¹­ìœ¼ë¡œ ì´ë¯¸ ìžˆëŠ”ì§€ í™•ì¸
        if item_title in existing_titles:
            continue
            
        # 2. ì˜ë¯¸ì  ìœ ì‚¬ì„±ìœ¼ë¡œ ì´ë¯¸ ìžˆëŠ”ì§€ í™•ì¸
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
            candidate_items.append(pop_item)
    
    # ê³ ê¸‰ ì ìˆ˜ ê³„ì‚°
    enhanced_items = ai_engine.calculate_advanced_scores(candidate_items, user_type, user_vector)
    
    # ìƒìœ„ 5ê°œ ì„ íƒí•˜ì—¬ ìµœì¢… í˜•íƒœë¡œ ë³€í™˜
    missing_items = []
    for item in enhanced_items[:5]:
        # Decimalì„ floatë¡œ ì•ˆì „í•˜ê²Œ ë³€í™˜
        popularity_rate = float(item['popularity_rate']) if isinstance(item['popularity_rate'], decimal.Decimal) else item['popularity_rate']
        priority_score = float(item['priority_score']) if isinstance(item['priority_score'], decimal.Decimal) else item['priority_score']
        
        missing_items.append({
            'item_title': item['item_title'],
            'item_description': item['item_description'],
            'item_tag': item['item_tag'],
            'popularity_rate': popularity_rate,
            'avg_offset_days': item['avg_offset_days'],
            'priority_score': priority_score,
            'missing_reason': item['recommendation_reason'],
            'confidence_score': item['ai_advanced_score']
        })
    
    return missing_items

def calculate_priority_scores(items: List[dict], departure_date: str, popularity_data: List[dict]) -> List[dict]:
    """ìš°ì„ ìˆœìœ„ ì ìˆ˜ ìž¬ê³„ì‚° - ê³ ê¸‰ AI ë¶„ì„ ì ìš©"""
    departure_dt = datetime.strptime(departure_date, "%Y-%m-%d")
    days_until = (departure_dt - datetime.now()).days
    
    # ê³ ê¸‰ AI ì—”ì§„ ì´ˆê¸°í™”
    ai_engine = AdvancedAIEngine()
    
    # ì‚¬ìš©ìž í–‰ë™ íŒ¨í„´ ë¶„ì„
    user_behavior = ai_engine.analyze_user_behavior(items)
    user_vector = ai_engine.create_user_vector(items, user_behavior)
    user_type, type_name, confidence = ai_engine.predict_user_type(user_vector)
    
    print(f"ðŸŽ¯ ìš°ì„ ìˆœìœ„ ìž¬ì •ë ¬ - ì‚¬ìš©ìž ìœ í˜•: {type_name}")
    
    # ì¸ê¸° í†µê³„ë¥¼ ë¹ ë¥¸ ì¡°íšŒë¥¼ ìœ„í•´ ë”•ì…”ë„ˆë¦¬ë¡œ ë³€í™˜
    popularity_dict = {stat['item_title']: stat for stat in popularity_data}
    
    reordered_items = []
    
    for i, item in enumerate(items):
        original_priority = i + 1
        is_fixed = item.get('is_fixed', False)
        
        # ì¸ê¸° í†µê³„ì—ì„œ í•´ë‹¹ í•­ëª© ì°¾ê¸°
        stat = popularity_dict.get(item['title'])
        
        if stat:
            # Decimalì„ floatë¡œ ì•ˆì „í•˜ê²Œ ë³€í™˜
            popularity_rate = float(stat['popularity_rate']) if isinstance(stat['popularity_rate'], decimal.Decimal) else stat['popularity_rate']
            priority_score = float(stat['priority_score']) if isinstance(stat['priority_score'], decimal.Decimal) else stat['priority_score']
            
            # ê¸´ê¸‰ë„ ê³„ì‚°
            recommended_prep_day = abs(stat['avg_offset_days'])
            urgency_score = min(1.0, recommended_prep_day / max(1, days_until)) if days_until <= recommended_prep_day else 0.3
            
            # ì‚¬ìš©ìž ìœ í˜•ë³„ ê°€ì¤‘ì¹˜
            type_weights = {
                0: {'DOCUMENT': 0.3, 'INSURANCE': 0.2},  # ì™„ë²½ì£¼ì˜ìž
                1: {'DOCUMENT': 0.2, 'EXCHANGE': 0.15},  # ê³„íší˜•
                2: {'EXCHANGE': 0.25, 'ETC': 0.2},       # ë§‰íŒìŠ¤íŒŒíŠ¸
                3: {'INSURANCE': 0.3, 'DOCUMENT': 0.25}, # ì‹ ì¤‘í˜•
                4: {'EXCHANGE': 0.2, 'ETC': 0.15}        # ì‹¤ìš©ì£¼ì˜ìž
            }
            
            type_bonus = type_weights.get(user_type, {}).get(item.get('tag', 'ETC'), 0.0)
            
            # is_fixed í•­ëª©ì— ëŒ€í•œ ê°€ì¤‘ì¹˜ ì¶”ê°€
            fixed_bonus = 0.2 if is_fixed else 0.0
            
            # AI ìš°ì„ ìˆœìœ„ ê³„ì‚° (ë” ì •êµí•œ ê³µì‹)
            ai_priority_score = (
                popularity_rate * 0.4 +  # ì¸ê¸°ë„
                urgency_score * 0.3 +    # ê¸´ê¸‰ë„
                type_bonus +             # ìœ í˜•ë³„ ê°€ì¤‘ì¹˜
                fixed_bonus +            # ê³ ì • ì¼ì • ë³´ë„ˆìŠ¤
                (1 - priority_score/10) * 0.1  # ìš°ì„ ìˆœìœ„ ì ìˆ˜
            )
            
            # ìž¬ì •ë ¬ ì´ìœ  (ë” êµ¬ì²´ì )
            if is_fixed and urgency_score > 0.5:
                reason = f"ðŸ“… {type_name} - ê³ ì • ì¼ì •: D{stat['avg_offset_days']} í•„ìˆ˜"
            elif type_bonus > 0.15:
                reason = f"ðŸŽ¯ {type_name} ìœ í˜• ë§žì¶¤ í•­ëª©"
            elif urgency_score > 0.7:
                reason = f"âš ï¸ ê¸´ê¸‰: ì¶œêµ­ê¹Œì§€ {days_until}ì¼ë§Œ ë‚¨ìŒ"
            elif popularity_rate > 0.9:
                reason = f"ðŸ”¥ í•„ìˆ˜: {popularity_rate*100:.0f}%ê°€ ì¤€ë¹„"
            elif is_fixed:
                reason = f"ðŸ“Œ ë‚ ì§œ ê³ ì • í•­ëª©: D{stat['avg_offset_days']} ê¶Œìž¥"
            else:
                reason = f"ðŸ“ {type_name} ìœ í˜• ì¼ë°˜ í•­ëª©"
                
        else:
            # í†µê³„ê°€ ì—†ëŠ” í•­ëª©ì€ ê¸°ë³¸ê°’
            urgency_score = 0.5
            fixed_bonus = 0.1 if is_fixed else 0.0
            ai_priority_score = 0.5 + fixed_bonus
            
            if is_fixed:
                reason = f"ðŸ“Œ {type_name} - ë‚ ì§œ ê³ ì • í•­ëª©"
            else:
                reason = f"ðŸ“ {type_name} - ì¼ë°˜ í•­ëª©"
        
        reordered_items.append({
            'title': item['title'],
            'description': item.get('description', ''),
            'tag': item.get('tag', 'NONE'),
            'original_priority': original_priority,
            'ai_priority_score': ai_priority_score,
            'urgency_score': urgency_score,
            'reorder_reason': reason,
            'is_fixed': is_fixed,
            'user_type': type_name
        })
    
    # AI ìš°ì„ ìˆœìœ„ ì ìˆ˜ë¡œ ì •ë ¬ (is_fixed + ìœ í˜• ê³ ë ¤ê°€ ìžì—°ìŠ¤ëŸ½ê²Œ ë°˜ì˜ë¨)
    reordered_items.sort(key=lambda x: x['ai_priority_score'], reverse=True)
    
    # ìƒˆë¡œìš´ ìˆœì„œ ë²ˆí˜¸ ë¶€ì—¬
    for i, item in enumerate(reordered_items):
        item['ai_priority'] = i + 1
    
    return reordered_items

# =============================================================================
# API ì—”ë“œí¬ì¸íŠ¸
# =============================================================================

@app.get("/")
async def root():
    """API ìƒíƒœ í™•ì¸"""
    return {"message": "Day-0 AI Recommendation Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """DB ì—°ê²° ìƒíƒœ í™•ì¸"""
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
    ëˆ„ë½ í•­ëª© ì¶”ì²œ API (ìºì‹œ ì ìš© + DB í˜¸í™˜ì„±)
    
    Spring Bootì—ì„œ í˜„ìž¬ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ë³´ë‚´ì£¼ë©´
    ì¸ê¸° í†µê³„ ê¸°ë°˜ìœ¼ë¡œ ëˆ„ë½ëœ í•­ëª©ë“¤ì„ ì°¾ì•„ì„œ ì¶”ì²œ
    """
    try:
        # ìºì‹œ í‚¤ ìƒì„± (ê¸°ì¡´ í•­ëª© í•´ì‹œ í¬í•¨)
        existing_items_dict = [item.model_dump() for item in request.existing_items]
        items_hash = hash_items(existing_items_dict)
        cache_key = get_cache_key("missing", request.country_code, request.program_type_id, items_hash)
        
        # ìºì‹œ í™•ì¸ (1ì‹œê°„ ìœ íš¨)
        cached_result = get_from_cache(cache_key, max_age_hours=1)
        if cached_result:
            return MissingItemsResponse(**cached_result)
        
        # ìºì‹œ ë¯¸ìŠ¤ - AI ë¶„ì„ ì‹¤í–‰
        print(f"ðŸ¤– AI ë¶„ì„ ì‹¤í–‰: missing-items")
        
        # ì¸ê¸° í†µê³„ ë°ì´í„° ì¡°íšŒ
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        
        # ëˆ„ë½ëœ í•­ëª© ì°¾ê¸°
        missing_items_data = find_missing_items(existing_items_dict, popularity_data)
        
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
                confidence_score=item['confidence_score']
            )
            for item in missing_items_data
        ]
        
        # ìš”ì•½ ë©”ì‹œì§€
        if len(missing_items) == 0:
            summary = "ðŸŽ‰ ì™„ë²½í•©ë‹ˆë‹¤! ëˆ„ë½ëœ í•­ëª©ì´ ì—†ì–´ìš”."
        elif len(missing_items) <= 2:
            summary = f"ðŸ’¡ {len(missing_items)}ê°œì˜ í•­ëª©ì„ ì¶”ê°€ë¡œ í™•ì¸í•´ë³´ì„¸ìš”."
        else:
            summary = f"âš ï¸ {len(missing_items)}ê°œì˜ ì¤‘ìš”í•œ í•­ëª©ì´ ëˆ„ë½ë˜ì—ˆì–´ìš”."
        
        result = MissingItemsResponse(
            missing_items=missing_items,
            total_missing=len(missing_items),
            recommendation_summary=summary
        )
        
        # ìºì‹œì— ì €ìž¥
        save_to_cache(cache_key, result.model_dump())
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/recommendations/priority-reorder", response_model=PriorityReorderResponse)
async def reorder_priority(request: PriorityReorderRequest):
    """
    ìš°ì„ ìˆœìœ„ ìž¬ì •ë ¬ API (ìºì‹œ ì ìš© + is_fixed í™œìš©)
    
    í˜„ìž¬ ì²´í¬ë¦¬ìŠ¤íŠ¸ì˜ í•­ëª©ë“¤ì„ ì¸ê¸°ë„ì™€ ê¸´ê¸‰ë„, is_fixed ê¸°ë°˜ìœ¼ë¡œ
    ìš°ì„ ìˆœìœ„ë¥¼ ìž¬ì •ë ¬í•´ì„œ ì¶”ì²œ
    """
    try:
        # ìºì‹œ í‚¤ ìƒì„± (í˜„ìž¬ í•­ëª© í•´ì‹œ + ì¶œêµ­ë‚ ì§œ í¬í•¨)
        current_items_dict = [item.model_dump() for item in request.current_items]
        items_hash = hash_items(current_items_dict)
        departure_hash = hashlib.md5(request.departure_date.encode()).hexdigest()[:6]
        cache_key = get_cache_key("reorder", request.country_code, request.program_type_id, f"{items_hash}_{departure_hash}")
        
        # ìºì‹œ í™•ì¸ (6ì‹œê°„ ìœ íš¨ - ìš°ì„ ìˆœìœ„ëŠ” ìžì£¼ ì•ˆ ë°”ë€œ)
        cached_result = get_from_cache(cache_key, max_age_hours=6)
        if cached_result:
            return PriorityReorderResponse(**cached_result)
        
        # ìºì‹œ ë¯¸ìŠ¤ - AI ë¶„ì„ ì‹¤í–‰
        print(f"ðŸ¤– AI ë¶„ì„ ì‹¤í–‰: priority-reorder")
        
        # ì¶œêµ­ê¹Œì§€ ë‚¨ì€ ê¸°ê°„ ê³„ì‚°
        departure_date = datetime.strptime(request.departure_date, "%Y-%m-%d")
        days_until = (departure_date - datetime.now()).days
        
        # ì¸ê¸° í†µê³„ ë°ì´í„° ì¡°íšŒ
        popularity_data = get_popularity_stats(request.country_code, request.program_type_id)
        
        # ìš°ì„ ìˆœìœ„ ìž¬ê³„ì‚° (is_fixed ê³ ë ¤)
        reordered_items_data = calculate_priority_scores(current_items_dict, request.departure_date, popularity_data)
        
        # ì‘ë‹µ ë°ì´í„° ìƒì„±
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
        
        # ìš”ì•½ ë©”ì‹œì§€
        fixed_count = sum(1 for item in reordered_items if item.is_fixed)
        ai_engine = AdvancedAIEngine()
        sample_behavior = ai_engine.analyze_user_behavior([item.model_dump() for item in request.current_items])
        sample_vector = ai_engine.create_user_vector([item.model_dump() for item in request.current_items], sample_behavior)
        user_type, type_name, confidence = ai_engine.predict_user_type(sample_vector)
        
        if days_until <= 7:
            summary = f"âš ï¸ ì¶œêµ­ {days_until}ì¼ ì „! {type_name} ìœ í˜• - ê³ ì • ì¼ì • {fixed_count}ê°œ ìš°ì„  ì²˜ë¦¬"
        elif days_until <= 30:
            summary = f"ðŸ“‹ ì¶œêµ­ {days_until}ì¼ ì „, {type_name} ìœ í˜• - ê³ ì • í•­ëª© {fixed_count}ê°œ ë¨¼ì € í™•ì¸"
        else:
            summary = f"ðŸ“… ì¶œêµ­ {days_until}ì¼ ì „, {type_name} ìœ í˜• - ì—¬ìœ ë¡­ê²Œ ì¤€ë¹„ (ê³ ì • í•­ëª© {fixed_count}ê°œ)"
        
        result = PriorityReorderResponse(
            reordered_items=reordered_items,
            total_reordered=len(reordered_items),
            days_until_departure=days_until,
            reorder_summary=summary
        )
        
        # ìºì‹œì— ì €ìž¥
        save_to_cache(cache_key, result.model_dump())
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cache/status")
async def cache_status():
    """ìºì‹œ ìƒíƒœ í™•ì¸ (ë””ë²„ê¹…ìš©)"""
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
    """ëª¨ë“  ìºì‹œ ì‚­ì œ (ë””ë²„ê¹…ìš©)"""
    cleared_count = len(cache_dict)
    cache_dict.clear()
    return {"message": f"ëª¨ë“  ìºì‹œ ì‚­ì œ ì™„ë£Œ: {cleared_count}ê°œ í•­ëª©"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)