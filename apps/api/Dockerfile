FROM openjdk:17-jdk-slim

WORKDIR /app

# Gradle Wrapper와 설정 파일들 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# 소스 코드 복사
COPY src src

# Gradle Wrapper 실행 권한 부여
RUN chmod +x ./gradlew

# 애플리케이션 빌드 (테스트 제외)
RUN ./gradlew clean build -x test

# 8080 포트 노출
EXPOSE 8080

# 빌드된 JAR 파일 실행 (와일드카드 사용으로 정확한 이름 몰라도 됨)
CMD ["sh", "-c", "java -jar build/libs/*.jar"]
