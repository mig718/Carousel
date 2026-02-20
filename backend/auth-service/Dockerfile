FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/auth-service-*.jar app.jar

EXPOSE 8001

ENTRYPOINT ["java", "-jar", "app.jar"]
