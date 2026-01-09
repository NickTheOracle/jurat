FROM gradle:8.7-jdk11 AS build
WORKDIR /app
COPY . .
RUN gradle build --no-daemon

FROM eclipse-temurin:11-jre
WORKDIR /app
COPY --from=build /app/build/libs /app/libs
ENV PORT=4567
EXPOSE 4567
CMD ["java", "-cp", "/app/libs/*", "com.jurat.Server"]
