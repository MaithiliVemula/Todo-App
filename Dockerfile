# ---------- Stage 1: build the jar with Maven ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Download dependencies first so Docker can cache them between builds
COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# ---------- Stage 2: run it on a small Java runtime ----------
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/todo-app-1.0.0.jar app.jar

# Production settings: quieter logs, no public database console
ENV SHOW_SQL=false \
    H2_CONSOLE=false

# Free plans give about 512 MB of memory; keep the JVM inside that
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"

EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
