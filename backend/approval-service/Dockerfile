FROM openjdk:21-jdk-slim

WORKDIR /app

COPY target/approval-service-*.jar app.jar

EXPOSE 8003

ENTRYPOINT ["java", "-jar", "app.jar"]
