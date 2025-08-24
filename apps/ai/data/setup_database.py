import mysql.connector
from urllib.parse import urlparse
from dotenv import load_dotenv
import os

# 환경변수 로드
load_dotenv()

def get_db_connection():
    """Railway DB 연결"""
    mysql_url = os.getenv('MYSQLHOST')
    parsed = urlparse(mysql_url)
    
    return mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path[1:],  # 'railway'
        charset='utf8mb4'
    )

def execute_sql(cursor, sql, description):
    """SQL 실행 및 로그"""
    try:
        # 여러 문장으로 분리해서 실행
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
        for stmt in statements:
            if stmt:
                cursor.execute(stmt)
        print(f"✅ {description}")
        return True
    except Exception as e:
        print(f"❌ {description} 실패: {str(e)}")
        return False

def main():
    """전체 DB 구축 실행"""
    print("🚀 Railway DB 구축 시작...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # ===========================================
        # 1. 기본 테이블 생성
        # ===========================================
        
        print("\n📊 1단계: 기본 테이블 생성")
        
        # universities 테이블
        universities_sql = """
        CREATE TABLE IF NOT EXISTS universities (
          university_id BIGINT PRIMARY KEY AUTO_INCREMENT,
          name          VARCHAR(200) NOT NULL,
          country_code  CHAR(2)      NOT NULL,             
          email         VARCHAR(255),
          created_at    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          UNIQUE KEY uq_univ (country_code, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, universities_sql, "universities 테이블 생성")
        
        # program_type 테이블
        program_type_sql = """
        CREATE TABLE IF NOT EXISTS program_type (
          program_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,
          code            VARCHAR(50)  NOT NULL UNIQUE,
          name            VARCHAR(100) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, program_type_sql, "program_type 테이블 생성")
        
        # users 테이블 (필수 의존성)
        users_sql = """
        CREATE TABLE IF NOT EXISTS users (
          user_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
          name           VARCHAR(120) NOT NULL,
          email          VARCHAR(255) NOT NULL UNIQUE,
          nickname       VARCHAR(50)  NOT NULL,
          gender         ENUM('MALE','FEMALE') NULL,            
          birth          DATE NULL,                              
          profile_image  VARCHAR(500) NULL,
          mileage        BIGINT NOT NULL DEFAULT 0 CHECK (mileage >= 0),
          home_university_id BIGINT NULL,
          dest_university_id BIGINT NULL,
          created_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          CONSTRAINT fk_user_home FOREIGN KEY (home_university_id) REFERENCES universities(university_id) ON DELETE SET NULL,
          CONSTRAINT fk_user_dest FOREIGN KEY (dest_university_id) REFERENCES universities(university_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, users_sql, "users 테이블 생성")
        
        # departure_info 테이블
        departure_sql = """
        CREATE TABLE IF NOT EXISTS departure_info (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, departure_sql, "departure_info 테이블 생성")
        
        print("\n📋 2단계: 체크리스트 테이블 생성")
        
        # checklist_template 테이블
        template_sql = """
        CREATE TABLE IF NOT EXISTS checklist_template (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, template_sql, "checklist_template 테이블 생성")
        
        # checklist_template_item 테이블
        template_item_sql = """
        CREATE TABLE IF NOT EXISTS checklist_template_item (
          template_item_id BIGINT PRIMARY KEY AUTO_INCREMENT,
          template_id      BIGINT NOT NULL,
          title            VARCHAR(150) NOT NULL,
          description      TEXT NULL,
          offset_days      INT NOT NULL DEFAULT 0,
          tag              ENUM('NONE','SAVING','EXCHANGE','INSURANCE','DOCUMENT','ETC') NOT NULL DEFAULT 'NONE',
          default_amount   DECIMAL(18,2) NULL,
          created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          CONSTRAINT fk_titem_tpl FOREIGN KEY (template_id) REFERENCES checklist_template(template_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, template_item_sql, "checklist_template_item 테이블 생성")
        
        # user_checklist 테이블
        user_checklist_sql = """
        CREATE TABLE IF NOT EXISTS user_checklist (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, user_checklist_sql, "user_checklist 테이블 생성")
        
        # user_checklist_item 테이블
        user_checklist_item_sql = """
        CREATE TABLE IF NOT EXISTS user_checklist_item (
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
          CONSTRAINT fk_uci_ucl   FOREIGN KEY (user_checklist_id) REFERENCES user_checklist(user_checklist_id) ON DELETE CASCADE,
          CONSTRAINT fk_uci_titem FOREIGN KEY (template_item_id)  REFERENCES checklist_template_item(template_item_id) ON DELETE SET NULL,
          INDEX idx_uci_progress (user_checklist_id, status, due_date),
          INDEX idx_uci_due (due_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, user_checklist_item_sql, "user_checklist_item 테이블 생성")
        
        print("\n🤖 3단계: AI 관련 테이블 생성")
        
        # item_popularity_stats 테이블
        popularity_sql = """
        CREATE TABLE IF NOT EXISTS item_popularity_stats (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """
        execute_sql(cursor, popularity_sql, "item_popularity_stats 테이블 생성")
        
        conn.commit()
        print("\n✅ 모든 테이블 생성 완료!")
        
        # ===========================================
        # 4. 더미 데이터 입력
        # ===========================================
        
        print("\n📝 4단계: 더미 데이터 입력")
        
        # program_type 데이터
        program_data = """
        INSERT IGNORE INTO program_type (code, name) VALUES 
        ('EXCHANGE', '교환학생'),
        ('LANGUAGE', '어학연수'),
        ('INTERNSHIP', '해외인턴십'),
        ('VOLUNTEER', '해외봉사')
        """
        execute_sql(cursor, program_data, "program_type 더미 데이터")
        
        # universities 데이터
        univ_data = """
        INSERT IGNORE INTO universities (name, country_code, email) VALUES 
        ('한양대학교', 'KR', 'exchangeout@hanyang.ac.kr');
        
        INSERT IGNORE INTO universities (name, country_code) VALUES 
        ('LeTourneau University', 'US'),
        ('University of Oregon', 'US'),
        ('Temple University', 'US'),
        ('Waseda University', 'JP'),
        ('Sophia University', 'JP'),
        ('University of Konstanz', 'DE'),
        ('University of Bayreuth', 'DE')
        """
        execute_sql(cursor, univ_data, "universities 더미 데이터")
        
        # checklist_template 데이터
        template_data = """
        INSERT IGNORE INTO checklist_template (title, description, country_code, program_type_id) VALUES 
        ('미국 교환학생 준비 체크리스트', 'F-1 비자 및 미국 대학 교환학생을 위한 표준 준비 항목', 'US', 1),
        ('일본 교환학생 준비 체크리스트', '일본 대학 교환학생을 위한 표준 준비 항목', 'JP', 1),
        ('독일 교환학생 준비 체크리스트', '독일 대학 교환학생을 위한 표준 준비 항목', 'DE', 1);
        
        INSERT IGNORE INTO checklist_template (title, description, program_type_id) VALUES 
        ('교환학생 기본 준비 체크리스트', '모든 교환학생이 공통으로 준비해야 할 기본 항목', 1)
        """
        execute_sql(cursor, template_data, "checklist_template 더미 데이터")
        
        # checklist_template_item 데이터 (미국)
        template_item_us = """
        INSERT IGNORE INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
        (1, '여권 유효기간 확인', '6개월 이상 유효기간 확인 필수', -120, 'DOCUMENT', 50000.00),
        (1, 'F-1 학생비자 발급', 'DS-160 작성 및 영사관 인터뷰 예약', -90, 'DOCUMENT', 100000.00),
        (1, '항공권 예약', '왕복 항공권 또는 편도 항공권', -45, 'ETC', 100000.00),
        (1, '해외여행자보험 가입', '의료비 보장 필수', -30, 'INSURANCE', 60000.00),
        (1, '달러 환전', '현지 생활비 3-6개월분 환전', -21, 'EXCHANGE', 150000.00),
        (1, '짐 싸기 및 수하물 체크', '항공사 규정에 맞는 수하물 준비', -7, 'ETC', 50000.00)
        """
        execute_sql(cursor, template_item_us, "미국 템플릿 항목")
        
        # checklist_template_item 데이터 (일본)
        template_item_jp = """
        INSERT IGNORE INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
        (2, '여권 유효기간 확인', '6개월 이상 유효기간 확인', -100, 'DOCUMENT', 40000.00),
        (2, '학생비자 발급', '재학증명서, 입학허가서 준비', -60, 'DOCUMENT', 80000.00),
        (2, '항공권 예약', '한국-일본 왕복 또는 편도', -45, 'ETC', 80000.00),
        (2, '해외여행자보험', '의료비, 배상책임 보장', -21, 'INSURANCE', 50000.00),
        (2, '엔화 환전', '현지 생활비 2-3개월분', -14, 'EXCHANGE', 120000.00),
        (2, '재류카드 신청', '입국 후 14일 내 거주지 신고', 7, 'DOCUMENT', 35000.00)
        """
        execute_sql(cursor, template_item_jp, "일본 템플릿 항목")
        
        # checklist_template_item 데이터 (독일)
        template_item_de = """
        INSERT IGNORE INTO checklist_template_item (template_id, title, description, offset_days, tag, default_amount) VALUES
        (3, '여권 유효기간 확인', '6개월 이상 유효기간 확인', -120, 'DOCUMENT', 50000.00),
        (3, '독일 학생비자 발급', '장기체류 비자 또는 입국 후 거주허가', -75, 'DOCUMENT', 100000.00),
        (3, '항공권 예약', '한국-독일 왕복 항공권', -45, 'ETC', 120000.00),
        (3, '독일 건강보험 가입', 'AOK, TK 등 법정 건강보험', -30, 'INSURANCE', 70000.00),
        (3, '유로 환전', '현지 생활비 2-4개월분', -21, 'EXCHANGE', 130000.00),
        (3, 'Anmeldung (거주지 등록)', '거주지 등록 신고', 3, 'DOCUMENT', 40000.00)
        """
        execute_sql(cursor, template_item_de, "독일 템플릿 항목")
        
        # item_popularity_stats 데이터 (일부만)
        popularity_data = """
        INSERT IGNORE INTO item_popularity_stats (country_code, program_type_id, item_title, item_description, item_tag, popularity_rate, avg_offset_days, priority_score) VALUES
        ('US', 1, '여권 유효기간 확인', '6개월 이상 유효기간 확인 필수', 'DOCUMENT', 0.98, -120, 1),
        ('US', 1, 'F-1 학생비자 발급', 'DS-160 작성 및 영사관 인터뷰', 'DOCUMENT', 0.95, -90, 1),
        ('US', 1, '달러 환전', '현지 생활비 3-6개월분 환전', 'EXCHANGE', 0.94, -21, 2),
        ('JP', 1, '여권 유효기간 확인', '6개월 이상 유효기간 확인', 'DOCUMENT', 0.97, -100, 1),
        ('JP', 1, '엔화 환전', '현지 생활비 2-3개월분', 'EXCHANGE', 0.92, -14, 2),
        ('DE', 1, '여권 유효기간 확인', '6개월 이상 유효기간 확인', 'DOCUMENT', 0.96, -120, 1),
        ('DE', 1, '유로 환전', '현지 생활비 2-4개월분', 'EXCHANGE', 0.90, -21, 2)
        """
        execute_sql(cursor, popularity_data, "item_popularity_stats 더미 데이터")
        
        conn.commit()
        print("\n🎉 모든 더미 데이터 입력 완료!")
        
        # 최종 확인
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"\n📊 생성된 테이블 ({len(tables)}개):")
        for table in tables:
            print(f"  ✓ {table[0]}")
            
        print(f"\n🚀 Railway DB 구축 성공! 총 {len(tables)}개 테이블 생성됨")
        
    except Exception as e:
        print(f"\n❌ DB 구축 실패: {str(e)}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
