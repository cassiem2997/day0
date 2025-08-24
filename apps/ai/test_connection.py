import mysql.connector
from urllib.parse import urlparse
from dotenv import load_dotenv
import os

load_dotenv()
mysql_url = os.getenv('MYSQLHOST')
print("연결 URL:", mysql_url)

# 간단한 연결 테스트만
try:
    parsed = urlparse(mysql_url)
    conn = mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path[1:],
        charset='utf8mb4',
        connection_timeout=10
    )
    print("✅ 연결 성공!")
    conn.close()
except Exception as e:
    print("❌ 연결 실패:", e)