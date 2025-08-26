-- Day0 프로젝트 완전한 데이터베이스 초기화 스크립트
-- 스키마 생성 + 모든 더미 데이터 포함

DROP DATABASE IF EXISTS day0_db;
CREATE DATABASE IF NOT EXISTS day0_db;
USE day0_db;

-- =========================================================
-- 1. 테이블 생성 (외래키 순서 고려)
-- =========================================================

-- 파견 종류
CREATE TABLE program_type (
  program_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(50)  NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 재학 대학 + 파견 대학 
CREATE TABLE universities (
  university_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  country_code  CHAR(2)      NOT NULL,             
  email         VARCHAR(255),
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_univ (country_code, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자
CREATE TABLE users (
  user_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password       VARCHAR(255) NOT NULL,  
  nickname       VARCHAR(50)  NOT NULL,
  gender         ENUM('MALE','FEMALE') NULL,            
  birth          DATE NULL,                              
  profile_image  VARCHAR(500) NULL,
  mileage        BIGINT NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  user_key       VARCHAR(64) UNIQUE,

  home_university_id BIGINT NULL,
  dest_university_id BIGINT NULL,

  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_user_home FOREIGN KEY (home_university_id) REFERENCES universities(university_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_dest FOREIGN KEY (dest_university_id) REFERENCES universities(university_id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 출국 정보
CREATE TABLE departure_info (
  departure_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id          BIGINT NOT NULL,
  university_id    BIGINT NULL,
  program_type_id  BIGINT NULL,
  country_code     CHAR(2) NOT NULL,
  start_date       TIMESTAMP(3) NOT NULL,          
  end_date         TIMESTAMP(3) NULL,                 
  status           ENUM('PLANNED','ONGOING','COMPLETED','CANCELED') NOT NULL DEFAULT 'PLANNED',
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_dep_user      FOREIGN KEY (user_id)        REFERENCES users(user_id)              ON DELETE CASCADE,
  CONSTRAINT fk_dep_univ      FOREIGN KEY (university_id)  REFERENCES universities(university_id) ON DELETE SET NULL,
  CONSTRAINT fk_dep_progtype  FOREIGN KEY (program_type_id) REFERENCES program_type(program_type_id) ON DELETE SET NULL,

  CHECK (end_date IS NULL OR start_date <= end_date),

  INDEX idx_dep_user_dates    (user_id, start_date),
  INDEX idx_dep_country_dates (country_code, start_date),
  INDEX idx_dep_status_dates  (status, start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 2. 사용자 입출금 계좌 관련
-- =========================================================

-- 사용자 계좌
CREATE TABLE user_account (
  account_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  account_type ENUM('CHECKING','SAVINGS','FX','GOAL') NOT NULL DEFAULT 'CHECKING',
  currency     CHAR(3) NOT NULL DEFAULT 'KRW',
  balance      DECIMAL(18,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_user_account_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_type_ccy (user_id, account_type, currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 계좌 거래 
CREATE TABLE account_transaction (
  tx_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_id      BIGINT NOT NULL,
  tx_type         ENUM('DEPOSIT','WITHDRAW','TRANSFER','FX','FEE') NOT NULL,
  amount          DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  balance_after   DECIMAL(18,2) NOT NULL,
  related_tx_id   BIGINT NULL,
  description     VARCHAR(200) NULL,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_tx_account FOREIGN KEY (account_id) REFERENCES user_account(account_id) ON DELETE CASCADE,
  INDEX idx_tx_account_time (account_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 3. 체크리스트 관련
-- =========================================================

-- 체크리스트 템플릿
CREATE TABLE checklist_template (
  template_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  title           VARCHAR(150) NOT NULL,
  description     VARCHAR(500) NULL,
  country_code    CHAR(2)   NULL,
  program_type_id BIGINT    NULL,
  university_id   BIGINT    NULL,

  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_tpl_program   FOREIGN KEY (program_type_id) REFERENCES program_type(program_type_id) ON DELETE SET NULL,
  CONSTRAINT fk_tpl_univ      FOREIGN KEY (university_id)   REFERENCES universities(university_id)  ON DELETE SET NULL,

  INDEX idx_tp_filter (country_code, program_type_id, university_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=2;

-- 템플릿 항목
CREATE TABLE checklist_template_item (
  template_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id      BIGINT NOT NULL,
  title            VARCHAR(150) NOT NULL,
  description      TEXT NULL,
  offset_days      INT NOT NULL DEFAULT 0,
  tag              ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') NOT NULL DEFAULT 'NONE',
  default_amount   DECIMAL(18,2) NULL,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_titem_tpl FOREIGN KEY (template_id) REFERENCES checklist_template(template_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 체크리스트
CREATE TABLE user_checklist (
  user_checklist_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id           BIGINT NOT NULL,
  departure_id      BIGINT NOT NULL,
  template_id       BIGINT NULL,
  title             VARCHAR(150) NOT NULL,
  visibility        ENUM('PUBLIC','PRIVATE','UNLISTED') NOT NULL DEFAULT 'PUBLIC',
  
  created_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_ucl_user   FOREIGN KEY (user_id)      REFERENCES users(user_id)               ON DELETE CASCADE,
  CONSTRAINT fk_ucl_dep    FOREIGN KEY (departure_id) REFERENCES departure_info(departure_id) ON DELETE CASCADE,
  CONSTRAINT fk_ucl_tpl    FOREIGN KEY (template_id)  REFERENCES checklist_template(template_id) ON DELETE SET NULL,

  UNIQUE KEY uq_ucl_user_dep_tpl (user_id, departure_id, template_id),
  INDEX idx_ucl_user_dep (user_id, departure_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 체크리스트 항목 
CREATE TABLE user_checklist_item (
  uci_id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_checklist_id BIGINT NOT NULL,
  template_item_id  BIGINT NULL,
  title             VARCHAR(150) NOT NULL,
  description       TEXT NULL,
  due_date          TIMESTAMP(3) NULL,
  status            ENUM('TODO','DOING','DONE','SKIP') NOT NULL DEFAULT 'TODO',
  completed_at      TIMESTAMP(3) NULL,
  tag               ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') NOT NULL DEFAULT 'NONE',
  linked_amount     DECIMAL(18,2) NULL,
  created_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  is_fixed          BOOLEAN NOT NULL DEFAULT FALSE,
	
  CONSTRAINT fk_uci_ucl   FOREIGN KEY (user_checklist_id) REFERENCES user_checklist(user_checklist_id) ON DELETE CASCADE,
  CONSTRAINT fk_uci_titem FOREIGN KEY (template_item_id)  REFERENCES checklist_template_item(template_item_id) ON DELETE SET NULL,

  INDEX idx_uci_progress (user_checklist_id, status, due_date),
  INDEX idx_uci_due (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI 기반 체크리스트 생성 관련

-- 사용자 행동 패턴
CREATE TABLE user_behavior_analytics (
    behavior_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    departure_id BIGINT NOT NULL,
    
    total_items INT NOT NULL DEFAULT 0,
    completed_items INT NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    
    behavior_type ENUM('EARLY_BIRD','STEADY','LAST_MINUTE','INACTIVE') DEFAULT 'STEADY',
    
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (departure_id) REFERENCES departure_info(departure_id) ON DELETE CASCADE,
    
    UNIQUE KEY uq_user_departure (user_id, departure_id),
    INDEX idx_behavior_type (behavior_type, completion_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ai 추천 결과 
CREATE TABLE ai_recommendations (
    rec_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    user_checklist_id BIGINT NOT NULL,
    
    recommended_item_title VARCHAR(150) NOT NULL,
    recommended_item_description TEXT NULL,
    recommended_tag ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') DEFAULT 'NONE',
    recommended_offset_days INT NULL,        
    recommended_amount DECIMAL(18,2) NULL,   
    
    confidence_score DECIMAL(5,4) NOT NULL,  
    reason_text VARCHAR(200) NULL,           
    
    is_applied BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP(3) NULL,
    
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user_checklist_id) REFERENCES user_checklist(user_checklist_id) ON DELETE CASCADE,
    
    INDEX idx_user_recommendations (user_id, created_at),
    INDEX idx_checklist_recommendations (user_checklist_id, created_at),
    INDEX idx_applied (is_applied, confidence_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정적 추천 DB
CREATE TABLE item_popularity_stats (
    stat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    country_code CHAR(2) NOT NULL,
    program_type_id BIGINT NOT NULL,
    item_title VARCHAR(150) NOT NULL,
    item_description TEXT NULL,
    item_tag ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') DEFAULT 'NONE',
    
    popularity_rate DECIMAL(5,4) NOT NULL,
    avg_offset_days INT NOT NULL,
    priority_score INT NOT NULL DEFAULT 5,
    
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    
    FOREIGN KEY (program_type_id) REFERENCES program_type(program_type_id) ON DELETE CASCADE,
    INDEX idx_country_program (country_code, program_type_id, popularity_rate DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 4. 적금 관련
-- =========================================================

-- 목표 적금 플랜
CREATE TABLE savings_plan (
  plan_id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id            BIGINT NOT NULL,
  departure_id       BIGINT NULL,
  goal_amount        DECIMAL(18,2) NOT NULL CHECK (goal_amount > 0),

  start_date         TIMESTAMP(3) NOT NULL,
  end_date           TIMESTAMP(3) NULL,
  frequency          ENUM('WEEKLY','MONTHLY') NOT NULL DEFAULT 'MONTHLY',
  amount_per_period  DECIMAL(18,2) NOT NULL CHECK (amount_per_period > 0),

  deposit_day        TINYINT NULL CHECK (deposit_day IS NULL OR deposit_day BETWEEN 1 AND 28),
  deposit_weekday    TINYINT NULL CHECK (deposit_weekday IS NULL OR deposit_weekday BETWEEN 0 AND 6),

  active             BOOLEAN NOT NULL DEFAULT TRUE,

  created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_plan_user FOREIGN KEY (user_id)      REFERENCES users(user_id)               ON DELETE CASCADE,
  CONSTRAINT fk_plan_dep  FOREIGN KEY (departure_id) REFERENCES departure_info(departure_id) ON DELETE SET NULL,

  INDEX idx_plan_user_active (user_id, active),
  INDEX idx_plan_dep        (departure_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정기 납입 예정표
CREATE TABLE payment_schedule (
  schedule_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id        BIGINT NOT NULL,
  plan_date      TIMESTAMP(3) NOT NULL,
  amount         DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  status         ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  executed_at    TIMESTAMP(3) NULL,
  external_tx_id VARCHAR(100) NULL,
  failure_reason VARCHAR(300) NULL,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_ps_plan FOREIGN KEY (plan_id) REFERENCES savings_plan(plan_id) ON DELETE CASCADE,

  UNIQUE KEY uq_ps_unique (plan_id, plan_date),
  INDEX idx_ps_status_date (status, plan_date),
  INDEX idx_ps_plan_date   (plan_id, plan_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 납입 내역
CREATE TABLE saving_txn (
  txn_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id          BIGINT NOT NULL,
  schedule_id      BIGINT NULL,

  txn_type         ENUM('REGULAR','MISSION') NOT NULL DEFAULT 'REGULAR',
  source_uci_id    BIGINT NULL,

  requested_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at     TIMESTAMP(3) NULL,
  amount           DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  status           ENUM('RECEIVED','PROCESSING','SUCCESS','FAILED') NOT NULL DEFAULT 'RECEIVED',
  idempotency_key  VARCHAR(80) NOT NULL,
  external_tx_id   VARCHAR(100) NULL,
  failure_reason   VARCHAR(300) NULL,

  posting_tx_id    BIGINT NULL,

  CONSTRAINT fk_txn_plan      FOREIGN KEY (plan_id)       REFERENCES savings_plan(plan_id)            ON DELETE CASCADE,
  CONSTRAINT fk_txn_schedule  FOREIGN KEY (schedule_id)   REFERENCES payment_schedule(schedule_id)    ON DELETE SET NULL,
  CONSTRAINT fk_txn_source    FOREIGN KEY (source_uci_id) REFERENCES user_checklist_item(uci_id)      ON DELETE SET NULL,
  CONSTRAINT fk_txn_posting   FOREIGN KEY (posting_tx_id) REFERENCES account_transaction(tx_id)       ON DELETE SET NULL,

  UNIQUE KEY uq_saving_idem (idempotency_key),
  INDEX idx_txn_plan_time (plan_id, requested_at),
  INDEX idx_txn_status    (status, requested_at),
  INDEX idx_txn_type      (txn_type, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 5. 환율/환전 관련
-- =========================================================

-- 환율 히스토리
CREATE TABLE exchange_rate_history (
  rate_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  base_ccy    CHAR(3) NOT NULL DEFAULT 'KRW',
  quote_ccy   CHAR(3) NOT NULL,
  rate        DECIMAL(18,6) NOT NULL,
  rate_date   TIMESTAMP(3) NOT NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE KEY uq_rate_tick (base_ccy, quote_ccy, rate_date),
  INDEX idx_rate_pair_time (base_ccy, quote_ccy, rate_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 환율 알림
CREATE TABLE exchange_rate_alert (
  alert_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  base_ccy     CHAR(3) NOT NULL DEFAULT 'KRW',
  currency     CHAR(3) NOT NULL,
  target_rate  DECIMAL(18,6) NOT NULL,
  direction    ENUM('>','<','>=','<=') NOT NULL DEFAULT '<=',
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_alert_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

  UNIQUE KEY uq_alert (user_id, base_ccy, currency, direction, target_rate),
  INDEX idx_alert_user_ccy (user_id, currency, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 환전 거래 내역
CREATE TABLE fx_transaction (
  fx_tx_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id         BIGINT NOT NULL,
  departure_id    BIGINT NULL,

  from_ccy        CHAR(3) NOT NULL,
  to_ccy          CHAR(3) NOT NULL,
  base_amount     DECIMAL(18,2) NOT NULL CHECK (base_amount > 0),
  quote_rate      DECIMAL(18,6) NULL,
  executed_rate   DECIMAL(18,6) NULL,
  quote_amount    DECIMAL(18,2) NULL,
  fees            DECIMAL(18,2) NOT NULL DEFAULT 0.00,

  status          ENUM('RECEIVED','PROCESSING','SUCCESS','FAILED') NOT NULL DEFAULT 'RECEIVED',
  requested_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at    TIMESTAMP(3) NULL,

  idempotency_key VARCHAR(80) NOT NULL,
  external_tx_id  VARCHAR(100) NULL,
  failure_reason  VARCHAR(300) NULL,

  debit_tx_id     BIGINT NULL,
  credit_tx_id    BIGINT NULL,

  CONSTRAINT fk_fx_user FOREIGN KEY (user_id)      REFERENCES users(user_id)               ON DELETE CASCADE,
  CONSTRAINT fk_fx_dep  FOREIGN KEY (departure_id) REFERENCES departure_info(departure_id) ON DELETE SET NULL,
  CONSTRAINT fk_fx_debit  FOREIGN KEY (debit_tx_id)  REFERENCES account_transaction(tx_id) ON DELETE SET NULL,
  CONSTRAINT fk_fx_credit FOREIGN KEY (credit_tx_id) REFERENCES account_transaction(tx_id) ON DELETE SET NULL,

  UNIQUE KEY uq_fx_idem (idempotency_key),
  INDEX idx_fx_user_time (user_id, requested_at),
  INDEX idx_fx_status    (status, requested_at),
  INDEX idx_fx_pair_time (from_ccy, to_ccy, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 6. 커뮤니티 관련
-- =========================================================

CREATE TABLE community_post (
  post_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  country_code  CHAR(2)   NULL,
  university_id BIGINT  NULL,
  title       VARCHAR(200) NOT NULL,
  body        MEDIUMTEXT NOT NULL,
  category    VARCHAR(50) NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_post_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE community_reply (
  reply_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id     BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  body        TEXT NOT NULL,
  is_adopted  BOOLEAN DEFAULT FALSE,
  adopted_at  TIMESTAMP(3) NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_reply_post FOREIGN KEY (post_id) REFERENCES community_post(post_id) ON DELETE CASCADE,
  CONSTRAINT fk_reply_user FOREIGN KEY (user_id) REFERENCES users(user_id)          ON DELETE CASCADE,

  INDEX idx_reply_post_time (post_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE post_like (
  post_id    BIGINT NOT NULL,
  user_id    BIGINT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id, user_id),

  CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES community_post(post_id) ON DELETE CASCADE,
  CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(user_id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 7. 더미 데이터 삽입
-- =========================================================

-- 7-1. 프로그램 타입
INSERT INTO program_type (code, name) VALUES 
('EXCHANGE', '교환학생'),
('LANGUAGE', '어학연수'),
('INTERNSHIP', '해외인턴십'),
('VOLUNTEER', '해외봉사');

-- 7-2. 대학교 정보
-- 한국 대학 (재학)
INSERT INTO universities (name, country_code, email) VALUES 
('한양대학교', 'KR', 'exchangeout@hanyang.ac.kr');

-- 파견 대학 (미국, 일본, 독일)
INSERT INTO universities (name, country_code) VALUES 
-- 미국
('LeTourneau University', 'US'),
('Stony Brok University', 'US'),
('Stetson University', 'US'),
('University of Oregon', 'US'),
('Kennesaw State University', 'US'),
('Temple University', 'US'),
('Northern Arizona University', 'US'),
('North Carolina State University', 'US'),
('State University of New York at Oswego', 'US'),
('The University of Texas at Austin', 'US'),
('University of North Texas', 'US'),
('University of North Dakota', 'US'),

-- 일본
('Shibaura Institute of Technology (SIT)', 'JP'),
('TAMA UNIVERSITY', 'JP'),
('Sophia University', 'JP'),
('Musashino University', 'JP'),
('Hokkaido University', 'JP'),
('Niigata University', 'JP'),
('Waseda University', 'JP'),
('Kansai University', 'JP'),
('Meiji University', 'JP'),
('University of Fukui', 'JP'),
('Ritsumeikan Asia Pacific University', 'JP'),
('Institute of Science Tokyo (Tokyo Institute of Technology)', 'JP'),
('Chiba University of Commerce', 'JP'),
('J.F.Oberlin University', 'JP'),
('Nagoya Institute of Technology', 'JP'),
('Nagoya University', 'JP'),
('Chuo University', 'JP'),
('Toyo University', 'JP'),

-- 독일
('Karlshochschule International University', 'DE'),
('University of Konstanz', 'DE'),
('European University Viadrina','DE'),
('Esslingen University','DE'),
('CBS International Business School','DE'),
('University of Bayreuth','DE'),
('Pforzheim University','DE'),
('Neu-Ulm University of Applied Sciences','DE'),
('International School of Management (ISM)','DE'),
('University of Tübingen','DE'),
('University of Stuttgart','DE'),
('Reutlingen University','DE');

-- 7-3. 체크리스트 템플릿
-- 공통 템플릿을 template_id=1로 먼저 삽입 (명시)
INSERT INTO checklist_template (template_id, title, description, program_type_id) VALUES 
(1, '교환학생 기본 준비 체크리스트', '모든 교환학생이 공통으로 준비해야 할 기본 항목', 1);

-- 국가별 템플릿은 자동 증가(2,3,4...)
INSERT INTO checklist_template (title, description, country_code, program_type_id) VALUES 
('미국 교환학생 준비 체크리스트', 'F-1 비자 및 미국 대학 교환학생을 위한 표준 준비 항목', 'US', 1),
('일본 교환학생 준비 체크리스트', '일본 대학 교환학생을 위한 표준 준비 항목', 'JP', 1),
('독일 교환학생 준비 체크리스트', '독일 대학 교환학생을 위한 표준 준비 항목', 'DE', 1);

-- 7-4. 템플릿 항목
-- 공통 템플릿 (template_id = 1) - 신한 금융 연계 항목 포함
INSERT INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
-- 기본 공통 항목
(1, '여권 발급/갱신', '유효기간 6개월 이상 남은 여권 준비', -100, 'DOCUMENT', 50000.00),
(1, '비자 신청', '해당 국가 학생비자 신청', -75, 'DOCUMENT', 80000.00),
(1, '항공권 예약', '왕복 또는 편도 항공권', -45, 'ETC', 100000.00),
(1, '해외여행자보험 가입', '의료비 및 배상책임 보장', -30, 'INSURANCE', 60000.00),
(1, '현지 통화 환전', '현지 생활비 준비', -14, 'EXCHANGE', 120000.00),
(1, '짐 싸기', '수하물 체크리스트 확인', -7, 'ETC', 40000.00),
-- 신한 금융 연계 항목 추가
(1, 'SOL 해외장기체류보험 가입', '출국 전 필수 보험 가입', -30, 'INSURANCE', 60000.00),
(1, 'SOL 트래블체크카드 발급', '해외 결제 및 현금 인출 가능', -21, 'EXCHANGE', 50000.00),
(1, '신한장학재단 해외교환장학생 지원', '해외 교환학생 대상 장학금 신청', -90, 'DOCUMENT', 0.00),
(1, 'D-적금 가입', '출국일까지 주차별 목표 금액 적립', -100, 'SAVING', 100000.00);

-- 미국 교환학생 템플릿 (template_id = 2)
INSERT INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
-- D-120 ~ D-90: 기본 서류 준비
(2, '여권 유효기간 확인', '6개월 이상 유효기간 확인 필수', -120, 'DOCUMENT', 50000.00),
(2, 'F-1 학생비자 발급', 'DS-160 작성 및 영사관 인터뷰 예약', -90, 'DOCUMENT', 100000.00),
(2, 'I-20 서류 확인', '학교에서 발급받은 I-20 원본 보관', -75, 'DOCUMENT', 30000.00),
(2, 'SEVIS Fee 납부', '학생 및 교환방문자 정보 시스템 수수료', -60, 'DOCUMENT', 70000.00),
-- D-60 ~ D-30: 생활 준비 및 보험
(2, '기숙사 신청', '학교 기숙사 또는 기타 숙소 예약', -60, 'ETC', 80000.00),
(2, '항공권 예약', '왕복 항공권 또는 편도 항공권', -45, 'ETC', 100000.00),
(2, '성적증명서 영문 발급', '학교 성적증명서 영문본', -45, 'DOCUMENT', 20000.00),
(2, '학교 의료보험 확인', '대학 필수 의료보험 가입 여부 확인', -45, 'INSURANCE', 40000.00),
(2, '해외여행자보험 가입', '의료비 보장 필수', -30, 'INSURANCE', 60000.00),
(2, '예방접종 증명서', '학교 요구 예방접종 기록', -30, 'DOCUMENT', 30000.00),
(2, '신용카드 발급', '해외 사용 가능한 체크카드/신용카드', -30, 'EXCHANGE', 40000.00),
-- D-30 ~ D-7: 금융 및 최종 준비
(2, '달러 환전', '현지 생활비 3-6개월분 환전', -21, 'EXCHANGE', 150000.00),
(2, '국제 유심/휴대폰 계획', 'Verizon, AT&T 등 통신사 계획 확인', -14, 'ETC', 30000.00),
(2, '짐 싸기 및 수하물 체크', '항공사 규정에 맞는 수하물 준비', -7, 'ETC', 50000.00),
-- D+7 ~ D+30: 현지 도착 후
(2, 'SSN 신청', '소셜시큐리티넘버 신청', 14, 'DOCUMENT', 40000.00),
(2, '미국 은행계좌 개설', 'Bank of America, Chase 등', 7, 'EXCHANGE', 50000.00);

-- 일본 교환학생 템플릿 (template_id = 3)
INSERT INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
-- D-100 ~ D-60: 기본 서류 준비
(3, '여권 유효기간 확인', '6개월 이상 유효기간 확인', -100, 'DOCUMENT', 40000.00),
(3, '학생비자 발급', '재학증명서, 입학허가서 준비', -60, 'DOCUMENT', 80000.00),
(3, '숙소 예약', '학교 기숙사 또는 사설 숙소', -60, 'ETC', 70000.00),
(3, '재학증명서 일본어 번역', '일본 대학 제출용', -45, 'DOCUMENT', 25000.00),
(3, '항공권 예약', '한국-일본 왕복 또는 편도', -45, 'ETC', 80000.00),
(3, '아포스티유 확인', '한국 서류 일본 사용을 위한 인증', -30, 'DOCUMENT', 30000.00),
-- D-30 ~ D-7: 보험 및 금융
(3, '국제학생증 발급', 'ISIC 카드로 할인 혜택', -30, 'ETC', 20000.00),
(3, '해외여행자보험', '의료비, 배상책임 보장', -21, 'INSURANCE', 50000.00),
(3, '엔화 환전', '현지 생활비 2-3개월분', -14, 'EXCHANGE', 120000.00),
(3, '일본 유심카드 준비', 'SoftBank, au, docomo', -7, 'ETC', 25000.00),
(3, '짐 싸기', '일본 생활용품 및 의류', -7, 'ETC', 40000.00),
-- D+7 ~ D+30: 현지 도착 후
(3, '재류카드 신청', '입국 후 14일 내 거주지 신고', 7, 'DOCUMENT', 35000.00),
(3, '국민건강보험 가입', '외국인등록 후 가입', 14, 'INSURANCE', 30000.00),
(3, '일본 은행계좌 개설', '미즈호, 미쓰이스미토모 등', 21, 'EXCHANGE', 40000.00);

-- 독일 교환학생 템플릿 (template_id = 4)
INSERT INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
-- D-120 ~ D-60: 기본 서류 및 재정 준비
(4, '여권 유효기간 확인', '6개월 이상 유효기간 확인', -120, 'DOCUMENT', 50000.00),
(4, '독일어 능력 증명서', 'TestDaF, DSH 또는 기타 증명서', -90, 'DOCUMENT', 60000.00),
(4, '독일 학생비자 발급', '장기체류 비자 또는 입국 후 거주허가', -75, 'DOCUMENT', 100000.00),
(4, 'Blocked Account 준비', '독일 유학생 필수 재정증명 계좌', -60, 'EXCHANGE', 150000.00),
(4, '독일 대학 입학 서류', '입학허가서, 성적증명서 등', -60, 'DOCUMENT', 40000.00),
(4, '숙소 확보', '기숙사, WG(룸셰어), 원룸 등', -75, 'ETC', 80000.00),
-- D-60 ~ D-30: 보험 및 서류 인증
(4, '아포스티유 인증', '한국 서류 독일 사용 인증', -45, 'DOCUMENT', 35000.00),
(4, '항공권 예약', '한국-독일 왕복 항공권', -45, 'ETC', 120000.00),
(4, '독일 건강보험 가입', 'AOK, TK 등 법정 건강보험', -30, 'INSURANCE', 70000.00),
-- D-30 ~ D-7: 최종 준비
(4, '유로 환전', '현지 생활비 2-4개월분', -21, 'EXCHANGE', 130000.00),
(4, '독일 유심/통신사 계획', '독일 현지 통신사 요금제', -7, 'ETC', 30000.00),
(4, '짐 싸기', '독일 생활용품 및 계절별 의류', -7, 'ETC', 50000.00),
-- D+3 ~ D+30: 현지 도착 후
(4, 'Anmeldung (거주지 등록)', '거주지 등록 신고', 3, 'DOCUMENT', 40000.00),
(4, '개인배상책임보험', 'Haftpflichtversicherung', 7, 'INSURANCE', 30000.00),
(4, '독일 은행계좌 개설', 'Deutsche Bank, Sparkasse 등', 14, 'EXCHANGE', 45000.00);

-- 7-5. 인기도 통계 (AI 추천용 정적 데이터)

-- 미국 교환학생 (US) - 15개 항목
INSERT INTO item_popularity_stats (country_code, program_type_id, item_title, item_description, item_tag, popularity_rate, avg_offset_days, priority_score) VALUES
-- 서류 관련 (DOCUMENT)
('US', 1, '여권 유효기간 확인', '6개월 이상 유효기간 확인 필수', 'DOCUMENT', 0.98, -120, 1),
('US', 1, 'F-1 학생비자 발급', 'DS-160 작성 및 영사관 인터뷰', 'DOCUMENT', 0.95, -90, 1),
('US', 1, 'I-20 서류 확인', '학교에서 발급받은 I-20 원본 보관', 'DOCUMENT', 0.93, -75, 2),
('US', 1, 'SEVIS Fee 납부', '학생 및 교환방문자 정보 시스템 수수료', 'DOCUMENT', 0.92, -60, 2),
('US', 1, 'SSN 신청 준비', '소셜시큐리티넘버 신청 서류 준비', 'DOCUMENT', 0.85, 14, 3),
('US', 1, '성적증명서 영문 발급', '학교 성적증명서 영문본', 'DOCUMENT', 0.88, -45, 3),
-- 금융 관련 (EXCHANGE, SAVING)
('US', 1, '달러 환전', '현지 생활비 3-6개월분 환전', 'EXCHANGE', 0.94, -21, 2),
('US', 1, '미국 은행계좌 개설 준비', 'Bank of America, Chase 등 서류 준비', 'EXCHANGE', 0.82, 7, 4),
('US', 1, '신용카드 발급', '해외 사용 가능한 체크카드/신용카드', 'EXCHANGE', 0.89, -30, 3),
-- 보험 관련 (INSURANCE)  
('US', 1, '해외여행자보험 가입', '의료비 보장 필수', 'INSURANCE', 0.91, -30, 2),
('US', 1, '학교 의료보험 확인', '대학 필수 의료보험 가입 여부 확인', 'INSURANCE', 0.87, -45, 3),
-- 생활 준비 (ETC)
('US', 1, '항공권 예약', '왕복 항공권 또는 편도 항공권', 'ETC', 0.96, -45, 1),
('US', 1, '기숙사 신청', '학교 기숙사 또는 기타 숙소 예약', 'ETC', 0.84, -60, 4),
('US', 1, '국제 유심/휴대폰 계획', 'Verizon, AT&T 등 통신사 계획', 'ETC', 0.78, -14, 5),
('US', 1, '예방접종 증명서', '학교 요구 예방접종 기록', 'DOCUMENT', 0.86, -30, 3);

-- 일본 교환학생 (JP) - 15개 항목  
INSERT INTO item_popularity_stats (country_code, program_type_id, item_title, item_description, item_tag, popularity_rate, avg_offset_days, priority_score) VALUES
-- 서류 관련 (DOCUMENT)
('JP', 1, '여권 유효기간 확인', '6개월 이상 유효기간 확인', 'DOCUMENT', 0.97, -100, 1),
('JP', 1, '학생비자 발급', '재학증명서, 입학허가서 준비', 'DOCUMENT', 0.94, -60, 1),
('JP', 1, '재류카드 신청 준비', '입국 후 14일 내 거주지 신고용 서류', 'DOCUMENT', 0.85, 7, 3),
('JP', 1, '국민건강보험 가입 준비', '외국인등록 후 가입 서류', 'DOCUMENT', 0.83, 14, 4),
('JP', 1, '재학증명서 일본어 번역', '일본 대학 제출용', 'DOCUMENT', 0.89, -45, 3),
('JP', 1, '아포스티유 확인', '한국 서류 일본 사용을 위한 인증', 'DOCUMENT', 0.81, -30, 4),
-- 금융 관련 (EXCHANGE, SAVING)
('JP', 1, '엔화 환전', '현지 생활비 2-3개월분', 'EXCHANGE', 0.92, -14, 2),
('JP', 1, '일본 은행계좌 개설 준비', '미즈호, 미쓰이스미토모 등', 'EXCHANGE', 0.79, 21, 5),
('JP', 1, '국제학생증 발급', 'ISIC 카드로 할인 혜택', 'ETC', 0.72, -30, 5),
-- 보험 관련 (INSURANCE)
('JP', 1, '해외여행자보험', '의료비, 배상책임 보장', 'INSURANCE', 0.88, -21, 2),
('JP', 1, '일본 국민건강보험 이해', '가입 절차 및 혜택 숙지', 'INSURANCE', 0.76, 7, 4),
-- 생활 준비 (ETC)
('JP', 1, '항공권 예약', '한국-일본 왕복 또는 편도', 'ETC', 0.95, -45, 1),
('JP', 1, '숙소 예약', '학교 기숙사 또는 사설 숙소', 'ETC', 0.87, -60, 3),
('JP', 1, '일본 유심카드 준비', 'SoftBank, au, docomo', 'ETC', 0.74, -7, 5),
('JP', 1, '일본어 기초 공부', '기본 생활 일본어 학습', 'ETC', 0.68, -90, 6);

-- 독일 교환학생 (DE) - 15개 항목
INSERT INTO item_popularity_stats (country_code, program_type_id, item_title, item_description, item_tag, popularity_rate, avg_offset_days, priority_score) VALUES
-- 서류 관련 (DOCUMENT)  
('DE', 1, '여권 유효기간 확인', '6개월 이상 유효기간 확인', 'DOCUMENT', 0.96, -120, 1),
('DE', 1, '독일 학생비자 발급', '장기체류 비자 또는 입국 후 거주허가', 'DOCUMENT', 0.91, -75, 1), 
('DE', 1, 'Anmeldung 준비', '거주지 등록 신고 서류', 'DOCUMENT', 0.89, 3, 2),
('DE', 1, '독일 대학 입학 서류', '입학허가서, 성적증명서 등', 'DOCUMENT', 0.93, -60, 2),
('DE', 1, '독일어 능력 증명서', 'TestDaF, DSH 또는 기타 증명서', 'DOCUMENT', 0.84, -90, 3),
('DE', 1, '아포스티유 인증', '한국 서류 독일 사용 인증', 'DOCUMENT', 0.82, -45, 3),
-- 금융 관련 (EXCHANGE, SAVING)
('DE', 1, '유로 환전', '현지 생활비 2-4개월분', 'EXCHANGE', 0.90, -21, 2),
('DE', 1, '독일 은행계좌 개설', 'Deutsche Bank, Sparkasse 등', 'EXCHANGE', 0.86, 14, 3),
('DE', 1, 'Blocked Account 준비', '독일 유학생 필수 재정증명 계좌', 'EXCHANGE', 0.88, -60, 2),
-- 보험 관련 (INSURANCE)
('DE', 1, '독일 건강보험 가입', 'AOK, TK 등 법정 건강보험', 'INSURANCE', 0.92, -30, 2),
('DE', 1, '개인배상책임보험', 'Haftpflichtversicherung', 'INSURANCE', 0.79, 7, 4),
-- 생활 준비 (ETC)
('DE', 1, '항공권 예약', '한국-독일 왕복 항공권', 'ETC', 0.94, -45, 1),
('DE', 1, '숙소 확보', '기숙사, WG(룸셰어), 원룸 등', 'ETC', 0.85, -75, 3),
('DE', 1, '독일 유심/통신사 계획', '독일 현지 통신사 요금제', 'ETC', 0.71, -7, 5),
('DE', 1, '독일어 기초 학습', '일상 생활 독일어 준비', 'ETC', 0.73, -120, 5);

-- 7-6. 사용자 더미 데이터 (패스워드 포함)
-- 패스워드는 모두 BCrypt로 암호화된 "password123"
INSERT INTO users 
(name, email, password, nickname, gender, birth, profile_image, mileage, user_key, home_university_id, dest_university_id)
VALUES
('김민지', 'minji.kim@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'minji', 'FEMALE', '2000-03-15', NULL, 1200, 'a1b2c3d4e5f6a7b8',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='LeTourneau University' LIMIT 1)),

('박지훈', 'jihoon.park@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'hoon', 'MALE', '1999-11-02', NULL, 800, 'b1c2d3e4f5a6b7c8',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='Stony Brok University' LIMIT 1)),

('이수연', 'sooyeon.lee@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'sooya', 'FEMALE', '2001-05-21', NULL, 1500, 'c1d2e3f4a5b6c7d8',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='Shibaura Institute of Technology (SIT)' LIMIT 1)),

('최현우', 'hyunwoo.choi@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'hyun', 'MALE', '2000-07-30', NULL, 600, 'd1e2f3a4b5c6d7e8',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='Sophia University' LIMIT 1)),

('정다혜', 'dahye.jung@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'dada', 'FEMALE', '2001-01-12', NULL, 2000, 'e1f2a3b4c5d6e7f8',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='Waseda University' LIMIT 1)),

('오세진', 'sejin.oh@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'jin', 'MALE', '1998-09-18', NULL, 300, 'f1a2b3c4d5e6f7a8',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='University of Konstanz' LIMIT 1)),

('한예린', 'yerin.han@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'rin', 'FEMALE', '2000-12-25', NULL, 1700, 'a2b3c4d5e6f7a8b9',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='University of Bayreuth' LIMIT 1)),

('서준호', 'junho.seo@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'junho', 'MALE', '1999-04-09', NULL, 950, 'b2c3d4e5f6a7b8c9',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='University of Stuttgart' LIMIT 1)),

('강유진', 'yujin.kang@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'yuyu', 'FEMALE', '2001-06-03', NULL, 500, 'c2d3e4f5a6b7c8d9',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='Musashino University' LIMIT 1)),

('문지호', 'jiho.moon@example.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAPXvhfh3xhV3w/RCINz7.PH0Jye', 'moon', 'MALE', '1998-02-14', NULL, 1100, 'd2e3f4a5b6c7d8e9',
 (SELECT university_id FROM universities WHERE name='한양대학교' AND country_code='KR' LIMIT 1),
 (SELECT university_id FROM universities WHERE name='University of North Dakota' LIMIT 1));

-- 7-7. 출국 정보 더미 데이터
INSERT INTO departure_info (user_id, university_id, program_type_id, country_code, start_date, end_date, status) VALUES 
((SELECT user_id FROM users WHERE email='minji.kim@example.com'), 
 (SELECT university_id FROM universities WHERE name='LeTourneau University' LIMIT 1), 1, 'US', '2025-03-15 00:00:00', '2025-07-15 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='jihoon.park@example.com'), 
 (SELECT university_id FROM universities WHERE name='Stony Brok University' LIMIT 1), 1, 'US', '2025-02-20 00:00:00', '2025-06-20 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='sooyeon.lee@example.com'), 
 (SELECT university_id FROM universities WHERE name='Shibaura Institute of Technology (SIT)' LIMIT 1), 1, 'JP', '2025-04-01 00:00:00', '2025-08-01 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='hyunwoo.choi@example.com'), 
 (SELECT university_id FROM universities WHERE name='Sophia University' LIMIT 1), 1, 'JP', '2025-03-10 00:00:00', '2025-07-10 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='dahye.jung@example.com'), 
 (SELECT university_id FROM universities WHERE name='Waseda University' LIMIT 1), 1, 'JP', '2025-02-15 00:00:00', '2025-06-15 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='sejin.oh@example.com'), 
 (SELECT university_id FROM universities WHERE name='University of Konstanz' LIMIT 1), 1, 'DE', '2025-04-20 00:00:00', '2025-08-20 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='yerin.han@example.com'), 
 (SELECT university_id FROM universities WHERE name='University of Bayreuth' LIMIT 1), 1, 'DE', '2025-03-25 00:00:00', '2025-07-25 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='junho.seo@example.com'), 
 (SELECT university_id FROM universities WHERE name='University of Stuttgart' LIMIT 1), 1, 'DE', '2025-02-28 00:00:00', '2025-06-28 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='yujin.kang@example.com'), 
 (SELECT university_id FROM universities WHERE name='Musashino University' LIMIT 1), 1, 'JP', '2025-04-05 00:00:00', '2025-08-05 00:00:00', 'PLANNED'),
((SELECT user_id FROM users WHERE email='jiho.moon@example.com'), 
 (SELECT university_id FROM universities WHERE name='University of North Dakota' LIMIT 1), 1, 'US', '2025-03-01 00:00:00', '2025-07-01 00:00:00', 'PLANNED');

-- =========================================================
-- 8. 데이터 확인 쿼리
-- =========================================================
SELECT 'program_type' as table_name, COUNT(*) as count FROM program_type
UNION ALL
SELECT 'universities', COUNT(*) FROM universities  
UNION ALL
SELECT 'checklist_template', COUNT(*) FROM checklist_template
UNION ALL  
SELECT 'checklist_template_item', COUNT(*) FROM checklist_template_item
UNION ALL
SELECT 'item_popularity_stats', COUNT(*) FROM item_popularity_stats
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'departure_info', COUNT(*) FROM departure_info;

-- =========================================================
-- 9. 테스트 정보 출력
-- =========================================================
SELECT 
    '========== 테스트 계정 정보 ==========' as info
UNION ALL
SELECT 
    CONCAT('이메일: ', email, ' | 비밀번호: password123 | 닉네임: ', nickname) as info
FROM users 
LIMIT 5
UNION ALL
SELECT 
    '======================================' as info;

-- =========================================================
-- 10. 완료 메시지
-- =========================================================
SELECT 'Day0 데이터베이스 초기화 완료!' as message;