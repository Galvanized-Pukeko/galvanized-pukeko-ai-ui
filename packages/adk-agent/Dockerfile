# Use an official Maven image with a JDK. Choose a version appropriate for your project.
FROM maven:3.9.11-eclipse-temurin-25-noble AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src

# Expose the port your application will listen on.
# Cloud Run will set the PORT environment variable, which your app should use.
EXPOSE 8080

# The command to run your application.
# Use a shell so ${PORT} expands and quote exec.args so agent source-dir is passed correctly.
ENTRYPOINT ["sh", "-c", "mvn compile exec:java \
    -Dexec.mainClass=com.example.agent.web.VertexAdkWebServer \
    -Dexec.classpathScope=compile \
    -Dexec.args='--server.port=${PORT:-8080} --adk.agents.source-dir=target'"]
