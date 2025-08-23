# advanced_ai_features.py - 고도화된 AI 추천 시스템
# TF-IDF, PCA, K-means 클러스터링 기반 개인화 추천

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import PCA, LatentDirichletAllocation
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Tuple
import pickle
import os

class UserBehaviorAnalyzer:
    """사용자 행동 패턴 분석 및 클러스터링"""
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.pca = PCA(n_components=10)
        self.kmeans = KMeans(n_clusters=5, random_state=42)
        self.scaler = StandardScaler()
        
        # 사용자 유형 라벨
        self.user_types = {
            0: "완벽주의자 (Early Bird)",
            1: "계획형 (Steady Planner)", 
            2: "막판스파트 (Last Minute)",
            3: "신중형 (Careful Preparer)",
            4: "실용주의자 (Practical Type)"
        }
        
    def create_user_profile(self, user_items: List[dict], behavior_data: dict) -> np.ndarray:
        """사용자 프로필 벡터 생성"""
        
        # 1. 체크리스트 텍스트 특성 (TF-IDF)
        item_texts = [f"{item['title']} {item.get('description', '')}" for item in user_items]
        text_features = self.tfidf_vectorizer.fit_transform(item_texts).mean(axis=0).A1
        
        # 2. 행동 패턴 특성
        behavior_features = np.array([
            behavior_data.get('completion_rate', 0.5),
            behavior_data.get('avg_days_early', 0),
            behavior_data.get('total_items', 10),
            behavior_data.get('document_focus', 0.3),
            behavior_data.get('financial_focus', 0.3),
            len(user_items)
        ])
        
        # 3. 특성 결합 및 정규화
        if len(text_features) < 10:
            text_features = np.pad(text_features, (0, 10 - len(text_features)))
        
        combined_features = np.concatenate([text_features[:10], behavior_features])
        return self.scaler.fit_transform(combined_features.reshape(1, -1))[0]
    
    def fit_user_clusters(self, user_profiles: List[np.ndarray]) -> 'UserBehaviorAnalyzer':
        """사용자 클러스터 학습"""
        
        if len(user_profiles) < 5:
            # 데이터가 부족하면 기본 클러스터 생성
            print("⚠️ 사용자 데이터 부족 - 기본 클러스터 사용")
            return self
            
        # PCA로 차원 축소
        X = np.array(user_profiles)
        X_pca = self.pca.fit_transform(X)
        
        # K-means 클러스터링
        self.kmeans.fit(X_pca)
        
        print(f"✅ 사용자 클러스터링 완료: {len(user_profiles)}명 → {self.kmeans.n_clusters}개 클러스터")
        return self
    
    def predict_user_type(self, user_profile: np.ndarray) -> Tuple[int, str, float]:
        """사용자 유형 예측"""
        
        try:
            # PCA 변환 후 클러스터 예측
            user_pca = self.pca.transform(user_profile.reshape(1, -1))
            cluster_id = self.kmeans.predict(user_pca)[0]
            
            # 클러스터 중심과의 거리로 신뢰도 계산
            distances = self.kmeans.transform(user_pca)[0]
            confidence = 1.0 / (1.0 + distances[cluster_id])
            
            user_type = self.user_types.get(cluster_id, "일반형")
            
            return cluster_id, user_type, confidence
            
        except Exception as e:
            print(f"❌ 사용자 유형 예측 실패: {e}")
            return 1, "계획형 (Steady Planner)", 0.5

class AdvancedRecommendationEngine:
    """고도화된 추천 엔진"""
    
    def __init__(self):
        self.behavior_analyzer = UserBehaviorAnalyzer()
        self.item_embeddings = {}
        self.user_clusters = {}
        
    def extract_item_features(self, popularity_data: List[dict]) -> Dict[str, np.ndarray]:
        """항목별 특성 벡터 추출 (TF-IDF + LSA)"""
        
        # 1. 텍스트 특성 추출
        texts = [f"{item['item_title']} {item['item_description']}" for item in popularity_data]
        
        # TF-IDF 벡터화
        tfidf_vectorizer = TfidfVectorizer(max_features=50, stop_words='english')
        tfidf_matrix = tfidf_vectorizer.fit_transform(texts)
        
        # LSA (Latent Semantic Analysis) 적용
        lsa = LatentDirichletAllocation(n_components=10, random_state=42)
        lsa_features = lsa.fit_transform(tfidf_matrix)
        
        # 2. 통계적 특성 추출
        item_features = {}
        for i, item in enumerate(popularity_data):
            
            # 텍스트 특성 (LSA)
            text_features = lsa_features[i]
            
            # 통계적 특성
            stat_features = np.array([
                float(item['popularity_rate']),
                float(item['priority_score']) / 10.0,
                abs(item['avg_offset_days']) / 100.0,  # 정규화
                1.0 if item['item_tag'] == 'DOCUMENT' else 0.0,
                1.0 if item['item_tag'] == 'EXCHANGE' else 0.0,
                1.0 if item['item_tag'] == 'INSURANCE' else 0.0
            ])
            
            # 특성 결합
            combined = np.concatenate([text_features, stat_features])
            item_features[item['item_title']] = combined
            
        return item_features
    
    def find_similar_users_advanced(self, 
                                  target_user_profile: np.ndarray,
                                  all_user_profiles: List[Tuple[int, np.ndarray]],
                                  top_k: int = 5) -> List[int]:
        """PCA + 코사인 유사도 기반 유사 사용자 검색"""
        
        if len(all_user_profiles) < 2:
            return []
            
        # 사용자 프로필들을 행렬로 변환
        user_ids = [user_id for user_id, _ in all_user_profiles]
        profiles = np.array([profile for _, profile in all_user_profiles])
        
        # PCA로 차원 축소
        pca = PCA(n_components=min(10, profiles.shape[1]))
        profiles_pca = pca.fit_transform(profiles)
        target_pca = pca.transform(target_user_profile.reshape(1, -1))
        
        # 코사인 유사도 계산
        similarities = cosine_similarity(target_pca, profiles_pca)[0]
        
        # 상위 K명 선택
        top_indices = np.argsort(similarities)[::-1][:top_k]
        similar_user_ids = [user_ids[i] for i in top_indices if similarities[i] > 0.1]
        
        return similar_user_ids
    
    def recommend_with_clustering(self,
                                existing_items: List[dict],
                                user_behavior: dict,
                                popularity_data: List[dict],
                                all_user_data: List[dict] = None) -> List[dict]:
        """클러스터링 기반 고도화된 추천"""
        
        try:
            # 1. 사용자 프로필 생성
            user_profile = self.behavior_analyzer.create_user_profile(existing_items, user_behavior)
            
            # 2. 사용자 유형 분석
            cluster_id, user_type, confidence = self.behavior_analyzer.predict_user_type(user_profile)
            
            print(f"🤖 사용자 유형 분석: {user_type} (신뢰도: {confidence:.2f})")
            
            # 3. 항목 특성 추출
            item_features = self.extract_item_features(popularity_data)
            
            # 4. 기존 항목들의 평균 특성 벡터
            existing_titles = {item['title'].lower() for item in existing_items}
            existing_features = []
            
            for title, features in item_features.items():
                if title.lower() in existing_titles:
                    existing_features.append(features)
            
            if existing_features:
                user_preference_vector = np.mean(existing_features, axis=0)
            else:
                user_preference_vector = np.zeros(16)  # 기본 벡터
            
            # 5. 추천 점수 계산 (고도화)
            recommendations = []
            for item in popularity_data:
                item_title = item['item_title'].lower()
                
                # 이미 있는 항목 제외
                if item_title in existing_titles:
                    continue
                
                # 기본 점수
                base_score = float(item['popularity_rate']) * 0.4
                
                # 유형별 가중치
                type_bonus = self._get_type_bonus(cluster_id, item)
                
                # 특성 유사도 점수
                if item['item_title'] in item_features:
                    item_feature = item_features[item['item_title']]
                    similarity = cosine_similarity(
                        user_preference_vector.reshape(1, -1),
                        item_feature.reshape(1, -1)
                    )[0][0]
                    similarity_score = max(0, similarity) * 0.3
                else:
                    similarity_score = 0.1
                
                # 최종 점수
                final_score = base_score + type_bonus + similarity_score
                
                recommendations.append({
                    **item,
                    'ai_score': final_score,
                    'user_type': user_type,
                    'type_bonus': type_bonus,
                    'similarity_score': similarity_score,
                    'recommendation_reason': self._get_recommendation_reason(cluster_id, type_bonus, similarity_score)
                })
            
            # 6. 점수순 정렬 및 상위 5개 반환
            recommendations.sort(key=lambda x: x['ai_score'], reverse=True)
            return recommendations[:5]
            
        except Exception as e:
            print(f"❌ 고도화 추천 실패: {e}")
            # 폴백: 기본 추천 로직
            return self._fallback_recommendation(existing_items, popularity_data)
    
    def _get_type_bonus(self, cluster_id: int, item: dict) -> float:
        """사용자 유형별 보너스 점수"""
        
        item_tag = item['item_tag']
        popularity = float(item['popularity_rate'])
        
        # 유형별 선호도
        type_preferences = {
            0: {'DOCUMENT': 0.3, 'INSURANCE': 0.2},  # 완벽주의자
            1: {'DOCUMENT': 0.2, 'ETC': 0.1},        # 계획형  
            2: {'EXCHANGE': 0.2, 'ETC': 0.3},        # 막판스파트
            3: {'INSURANCE': 0.3, 'DOCUMENT': 0.2},  # 신중형
            4: {'EXCHANGE': 0.2, 'ETC': 0.1}         # 실용주의자
        }
        
        preference = type_preferences.get(cluster_id, {})
        return preference.get(item_tag, 0.0) + (popularity * 0.1)
    
    def _get_recommendation_reason(self, cluster_id: int, type_bonus: float, similarity_score: float) -> str:
        """추천 이유 생성"""
        
        if type_bonus > 0.2:
            return f"🎯 {self.behavior_analyzer.user_types[cluster_id]} 유형에게 인기"
        elif similarity_score > 0.2:
            return "🔍 선호 패턴과 유사한 항목"
        else:
            return "📊 일반적으로 많이 준비하는 항목"
    
    def _fallback_recommendation(self, existing_items: List[dict], popularity_data: List[dict]) -> List[dict]:
        """폴백 추천 (기본 로직)"""
        existing_titles = {item['title'].lower() for item in existing_items}
        
        recommendations = []
        for item in popularity_data:
            if item['item_title'].lower() not in existing_titles:
                recommendations.append({
                    **item,
                    'ai_score': float(item['popularity_rate']),
                    'recommendation_reason': "📊 기본 추천"
                })
        
        recommendations.sort(key=lambda x: x['ai_score'], reverse=True)
        return recommendations[:5]

# 사용 예시 및 테스트 함수
def test_advanced_recommendations():
    """고도화된 추천 시스템 테스트"""
    
    # 샘플 데이터
    existing_items = [
        {'title': '여권 발급', 'description': '6개월 이상 유효기간 확인', 'tag': 'DOCUMENT'},
        {'title': '항공권 예약', 'description': '왕복 항공권', 'tag': 'ETC'}
    ]
    
    user_behavior = {
        'completion_rate': 0.8,
        'avg_days_early': 15,
        'total_items': 12,
        'document_focus': 0.6,
        'financial_focus': 0.2
    }
    
    popularity_data = [
        {
            'item_title': 'F-1 학생비자 발급',
            'item_description': 'DS-160 작성 및 영사관 인터뷰',
            'item_tag': 'DOCUMENT',
            'popularity_rate': 0.95,
            'avg_offset_days': -90,
            'priority_score': 1
        },
        {
            'item_title': '달러 환전',
            'item_description': '현지 생활비 3-6개월분',
            'item_tag': 'EXCHANGE',
            'popularity_rate': 0.88,
            'avg_offset_days': -21,
            'priority_score': 2
        }
    ]
    
    # 추천 엔진 실행
    engine = AdvancedRecommendationEngine()
    recommendations = engine.recommend_with_clustering(
        existing_items, user_behavior, popularity_data
    )
    
    print("🚀 고도화된 추천 결과:")
    for rec in recommendations:
        print(f"  • {rec['item_title']} (점수: {rec.get('ai_score', 0):.3f})")
        print(f"    → {rec.get('recommendation_reason', '일반 추천')}")

if __name__ == "__main__":
    test_advanced_recommendations()