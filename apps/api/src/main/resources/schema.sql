DROP DATABASE day0_db;
CREATE DATABASE IF NOT EXISTS day0_db;
USE day0_db;

-- =========================================================
-- 0) Reference / Meta
-- =========================================================

-- 재학 대학 + 파견 대학 
CREATE TABLE universities (
  university_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,
  country_code  CHAR(2)      NOT NULL,             
  email         VARCHAR(255), -- 국제교류팀 
  created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_univ (country_code, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자
CREATE TABLE users (
  user_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
  name           VARCHAR(120) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  nickname       VARCHAR(50)  NOT NULL,
  gender         ENUM('MALE','FEMALE') NULL,            
  birth          DATE NULL,                              
  profile_image  VARCHAR(500) NULL,
  mileage        BIGINT NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  user_key VARCHAR(64) UNIQUE,

  home_university_id BIGINT NULL,
  dest_university_id BIGINT NULL,

  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_user_home FOREIGN KEY (home_university_id) REFERENCES universities(university_id) ON DELETE SET NULL,
  CONSTRAINT fk_user_dest FOREIGN KEY (dest_university_id) REFERENCES universities(university_id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 파견 종류
CREATE TABLE program_type (
  program_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code            VARCHAR(50)  NOT NULL UNIQUE,           -- EXCHANGE / LANGUAGE / INTERNSHIP / ...
  name            VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 사용자 출국 정보
CREATE TABLE departure_info (
  departure_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id          BIGINT NOT NULL,
  university_id    BIGINT NULL,                           -- 목적지 대학
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
-- 0-2) 사용자 입출금
-- =========================================================

-- 사용자 계좌
CREATE TABLE user_account (
  account_id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  account_type ENUM('CHECKING','SAVINGS','FX','GOAL') NOT NULL DEFAULT 'CHECKING',
  currency     CHAR(3) NOT NULL DEFAULT 'KRW',
  balance      DECIMAL(18,2) NOT NULL DEFAULT 0,          -- 현재 잔액(캐시)
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
  balance_after   DECIMAL(18,2) NOT NULL,                 -- 거래 후 잔액(검증용)
  related_tx_id   BIGINT NULL,                             -- 이체 시 상대 트랜잭션
  description     VARCHAR(200) NULL,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_tx_account FOREIGN KEY (account_id) REFERENCES user_account(account_id) ON DELETE CASCADE,
  INDEX idx_tx_account_time (account_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================================
-- 1) 체크리스트
-- =========================================================

-- 체크리스트 템플릿
CREATE TABLE checklist_template (
  template_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  title           VARCHAR(150) NOT NULL,
  description     VARCHAR(500) NULL,
  country_code    CHAR(2)   NULL,                           -- 추천 필터
  program_type_id BIGINT    NULL,                           -- 추천 필터
  university_id   BIGINT    NULL,                           -- 추천 필터

  created_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_tpl_program   FOREIGN KEY (program_type_id) REFERENCES program_type(program_type_id) ON DELETE SET NULL,
  CONSTRAINT fk_tpl_univ      FOREIGN KEY (university_id)   REFERENCES universities(university_id)  ON DELETE SET NULL,

  INDEX idx_tp_filter (country_code, program_type_id, university_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 템플릿 항목
CREATE TABLE checklist_template_item (
  template_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  template_id      BIGINT NOT NULL,
  title            VARCHAR(150) NOT NULL,
  description      TEXT NULL,
  offset_days      INT NOT NULL DEFAULT 0,                  -- D-day 기준 오프셋
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
  template_id       BIGINT NULL,                            -- 어떤 템플릿 기반인지
  title             VARCHAR(150) NOT NULL,
  visibility      ENUM('PUBLIC','PRIVATE','UNLISTED') NOT NULL DEFAULT 'PUBLIC',

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
  due_date          TIMESTAMP(3) NULL,                      -- departure.start_date + offset_days
  status            ENUM('TODO','DOING','DONE','SKIP') NOT NULL DEFAULT 'TODO',
  completed_at      TIMESTAMP(3) NULL,
  tag               ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') NOT NULL DEFAULT 'NONE',
  linked_amount     DECIMAL(18,2) NULL,
  created_at        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

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

    -- 간단한 통계
    total_items INT NOT NULL DEFAULT 0,
    completed_items INT NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,

    -- 행동 패턴 분류
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

    -- 추천 항목 정보
    recommended_item_title VARCHAR(150) NOT NULL,
    recommended_item_description TEXT NULL,
    recommended_tag ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') DEFAULT 'NONE',
    recommended_offset_days INT NULL,
    recommended_amount DECIMAL(18,2) NULL,

    -- AI 분석 결과
    confidence_score DECIMAL(5,4) NOT NULL,
    reason_text VARCHAR(200) NULL,

    -- 사용자 반응
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

    -- 수기 입력 통계 데이터
    popularity_rate DECIMAL(5,4) NOT NULL,      -- 0.85 = 85%가 준비
    avg_offset_days INT NOT NULL,               -- -30 = 보통 D-30에 준비
    priority_score INT NOT NULL DEFAULT 5,     -- 1(높음) ~ 10(낮음)

    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),

    FOREIGN KEY (program_type_id) REFERENCES program_type(program_type_id) ON DELETE CASCADE,
    INDEX idx_country_program (country_code, program_type_id, popularity_rate DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 2) Savings (적금)
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

  deposit_day        TINYINT NULL CHECK (deposit_day IS NULL OR deposit_day BETWEEN 1 AND 28), -- MONTHLY
  deposit_weekday    TINYINT NULL CHECK (deposit_weekday IS NULL OR deposit_weekday BETWEEN 0 AND 6), -- WEEKLY

  active             BOOLEAN NOT NULL DEFAULT TRUE,

  created_at         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_plan_user FOREIGN KEY (user_id)      REFERENCES users(user_id)               ON DELETE CASCADE,
  CONSTRAINT fk_plan_dep  FOREIGN KEY (departure_id) REFERENCES departure_info(departure_id) ON DELETE SET NULL,

  INDEX idx_plan_user_active (user_id, active),
  INDEX idx_plan_dep        (departure_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정기 납입 예정표(대외 연동/재시도 필요시 사용)
CREATE TABLE payment_schedule (
  schedule_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id        BIGINT NOT NULL,
  plan_date      TIMESTAMP(3) NOT NULL,                  -- 예정 납입시각(UTC)
  amount         DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  status         ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  executed_at    TIMESTAMP(3) NULL,
  external_tx_id VARCHAR(100) NULL,
  failure_reason VARCHAR(300) NULL,
  created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_ps_plan FOREIGN KEY (plan_id) REFERENCES savings_plan(plan_id) ON DELETE CASCADE,

  UNIQUE KEY uq_ps_unique (plan_id, plan_date),         -- 같은 시점 중복 방지
  INDEX idx_ps_status_date (status, plan_date),
  INDEX idx_ps_plan_date   (plan_id, plan_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 납입 내역
CREATE TABLE saving_txn (
  txn_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id          BIGINT NOT NULL,
  schedule_id      BIGINT NULL,                           -- 정기납입이면 존재

  txn_type         ENUM('REGULAR','MISSION') NOT NULL DEFAULT 'REGULAR',
  source_uci_id    BIGINT NULL,                           -- 미션 연동(사용자 체크리스트 항목)

  requested_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at     TIMESTAMP(3) NULL,
  amount           DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  status           ENUM('RECEIVED','PROCESSING','SUCCESS','FAILED') NOT NULL DEFAULT 'RECEIVED',
  idempotency_key  VARCHAR(80) NOT NULL,
  external_tx_id   VARCHAR(100) NULL,
  failure_reason   VARCHAR(300) NULL,

  -- 입출금 계좌 트랜잭션과 연결
  posting_tx_id    BIGINT NULL,                            -- account_transaction.tx_id

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
-- 3) FX / Exchange (환율/환전)
-- =========================================================

-- 환율 히스토리
CREATE TABLE exchange_rate_history (
  rate_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  base_ccy    CHAR(3) NOT NULL DEFAULT 'KRW',
  quote_ccy   CHAR(3) NOT NULL,                            -- USD/JPY/EUR...
  rate        DECIMAL(18,6) NOT NULL,
  rate_date   TIMESTAMP(3) NOT NULL,                       -- 시세 시각(UTC)
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE KEY uq_rate_tick (base_ccy, quote_ccy, rate_date),
  INDEX idx_rate_pair_time (base_ccy, quote_ccy, rate_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 환율 알림
CREATE TABLE exchange_rate_alert (
  alert_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id      BIGINT NOT NULL,
  base_ccy     CHAR(3) NOT NULL DEFAULT 'KRW',
  currency     CHAR(3) NOT NULL,                            -- 모니터링 통화
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

  from_ccy        CHAR(3) NOT NULL,                         -- 팔 통화
  to_ccy          CHAR(3) NOT NULL,                         -- 살 통화
  base_amount     DECIMAL(18,2) NOT NULL CHECK (base_amount > 0),  -- from_ccy 금액
  quote_rate      DECIMAL(18,6) NULL,                       -- 견적 환율(요청)
  executed_rate   DECIMAL(18,6) NULL,                       -- 체결 환율(성공)
  quote_amount    DECIMAL(18,2) NULL,                       -- to_ccy 수령액(성공)
  fees            DECIMAL(18,2) NOT NULL DEFAULT 0.00,

  status          ENUM('RECEIVED','PROCESSING','SUCCESS','FAILED') NOT NULL DEFAULT 'RECEIVED',
  requested_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at    TIMESTAMP(3) NULL,

  idempotency_key VARCHAR(80) NOT NULL,
  external_tx_id  VARCHAR(100) NULL,
  failure_reason  VARCHAR(300) NULL,

  -- 양쪽 계좌 트랜잭션 연결
  debit_tx_id     BIGINT NULL,                               -- from 통장 출금(account_transaction)
  credit_tx_id    BIGINT NULL,                               -- to 통장 입금(account_transaction)

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
-- 4) Community
-- =========================================================

CREATE TABLE community_post (
  post_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT NOT NULL,
  country_code  CHAR(2)   NULL,
  university_id BIGINT  NULL,
  title       VARCHAR(200) NOT NULL,
  body        MEDIUMTEXT NOT NULL,
  category    VARCHAR(50) NULL,                              -- SCHOOL/COUNTRY/TIPS...
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  CONSTRAINT fk_post_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE community_reply (
  reply_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id     BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  body        TEXT NOT NULL,
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

