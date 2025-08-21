-- checklist_template 더미 데이터
-- 미국, 일본, 독일 교환학생용 템플릿

INSERT INTO checklist_template (title, description, country_code, program_type_id) VALUES 
('미국 교환학생 준비 체크리스트', 'F-1 비자 및 미국 대학 교환학생을 위한 표준 준비 항목', 'US', 1),
('일본 교환학생 준비 체크리스트', '일본 대학 교환학생을 위한 표준 준비 항목', 'JP', 1),
('독일 교환학생 준비 체크리스트', '독일 대학 교환학생을 위한 표준 준비 항목', 'DE', 1);

-- 공통 템플릿 (국가 무관)
INSERT INTO checklist_template (title, description, program_type_id) VALUES 
('교환학생 기본 준비 체크리스트', '모든 교환학생이 공통으로 준비해야 할 기본 항목', 1);