# syntax=docker/dockerfile:1

FROM gradle:8.8-jdk21 AS builder
WORKDIR /workspace

COPY build.gradle settings.gradle gradlew gradlew.bat gradle.properties ./
COPY gradle ./gradle
RUN chmod +x ./gradlew

COPY src ./src
RUN ./gradlew clean bootJar -x test --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""

COPY --from=builder /workspace/build/libs/ootd-backend-0.0.1-SNAPSHOT.jar app.jar

RUN mkdir -p /app/uploads

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
