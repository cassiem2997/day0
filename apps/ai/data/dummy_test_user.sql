USE day0_db;
-- 1. 대학 데이터 확인/생성
INSERT IGNORE INTO universities (university_id, name, country_code) 
VALUES (1, '한양대학교', 'KR');

-- 2. 테스트용 사용자 생성
INSERT IGNORE INTO users (user_id, name, email, nickname, home_university_id) 
VALUES (1, '테스트사용자', 'test@example.com', 'testuser', 1);

-- 3. 테스트용 출국 정보 생성
INSERT IGNORE INTO departure_info (departure_id, user_id, country_code, program_type_id, start_date, status)
VALUES (1, 1, 'US', 1, '2024-12-01', 'PLANNED');