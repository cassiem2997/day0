apps/ai/
├── main.py                 # FastAPI 앱 실행 진입점
├── config/
│   ├── __init__.py
│   ├── database.py         # DB 연결 설정
│   └── settings.py         # 환경변수, 설정값
├── models/
│   ├── __init__.py
│   ├── requests.py         # 요청 Pydantic 모델들
│   └── responses.py        # 응답 Pydantic 모델들
├── services/
│   ├── __init__.py
│   ├── template_service.py # 체크리스트 템플릿 생성 로직
│   ├── recommendation_service.py # AI 기반 누락 항목 추천
│   └── analytics_service.py # 사용자 행동 분석 (미래 확장용)
├── repositories/
│   ├── __init__.py
│   ├── checklist_repository.py # 체크리스트 관련 DB 로직
│   └── stats_repository.py     # 통계 데이터 DB 로직
├── routes/
│   ├── __init__.py
│   ├── checklist.py        # 체크리스트 생성 API
│   └── recommendations.py  # 누락 항목 추천 API
├── utils/
│   ├── __init__.py
│   ├── text_analyzer.py    # TF-IDF, 텍스트 분석 유틸
│   └── date_utils.py       # 날짜 계산 유틸
└── requirements.txt        # 패키지 의존성

## 주요 분리 기준:

### 1. template_service.py
- 기본 템플릿 선택
- 출국일 기준 due_date 계산  
- 사용자 체크리스트 생성

### 2. recommendation_service.py  
- TF-IDF 기반 유사도 분석
- 누락 항목 자동 추천
- 기존 체크리스트 분석해서 추가 추천

### 3. checklist_repository.py
- 템플릿 조회, 저장
- 사용자 체크리스트 CRUD
- 통계 데이터 조회

### 4. 별도 추천 API
- POST /api/recommendations/missing-items
- POST /api/recommendations/optimize-checklist
- GET /api/recommendations/popular-items/{country_code}