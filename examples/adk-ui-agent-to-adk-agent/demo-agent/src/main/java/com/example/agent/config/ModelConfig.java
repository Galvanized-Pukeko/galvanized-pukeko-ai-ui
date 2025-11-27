package com.example.agent.config;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;
import com.example.agent.ServiceAgent;
import com.google.adk.models.Claude;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ModelConfig {

    private static final Logger log = LoggerFactory.getLogger(ServiceAgent.class);

    private static final Properties properties = new Properties();

    static {
        try (InputStream input = ModelConfig.class.getClassLoader()
                .getResourceAsStream("application.properties")) {
            if (input == null) {
                throw new RuntimeException("Unable to find application.properties");
            }
            properties.load(input);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to load application.properties", ex);
        }
    }

    public static Claude createAnthropicModel() {
        String modelName = getAnthropicModelName();
        String project = getEnvOrThrow("GOOGLE_CLOUD_PROJECT");
        String location = getEnvOrThrow("GOOGLE_CLOUD_LOCATION");

        try {
            AnthropicClient anthropicClient = AnthropicOkHttpClient.builder()
                    .backend(
                            VertexBackend.builder()
                                    .region(location)
                                    .project(project)
                                    .googleCredentials(GoogleCredentials.getApplicationDefault())
                                    .build()
                    )
                    .build();

            log.info("Creating client for Anthropic model: {}, project: {}, location: {}", modelName, project, location);

            return new Claude(modelName, anthropicClient);
        } catch (IOException ex) {
            throw new RuntimeException("Failed to create Anthropic client with Vertex AI backend", ex);
        }
    }

    private static String getEnvOrThrow(String envVar) {
        String value = System.getenv(envVar);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Environment variable " + envVar + " is required for Anthropic/Vertex AI configuration"
            );
        }
        return value;
    }

    public static String getModelProvider() {
        String provider = properties.getProperty("model.provider", "gemini");
        log.info("Using model provider: {}", provider);
        return provider;
    }

    public static String getGeminiModelName() {
        String modelName = properties.getProperty("model.gemini.name", "gemini-2.5-flash");
        log.info("Using Gemini model: {}", modelName);
        return modelName;
    }

    public static String getAnthropicModelName() {
        String modelName = properties.getProperty("model.anthropic.name");
        log.info("Using Anthropic model: {}", modelName);
        return modelName;
    }
}
