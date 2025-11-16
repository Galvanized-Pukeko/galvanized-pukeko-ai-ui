package com.example.agent.config;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.vertex.backends.VertexBackend;
import com.google.adk.models.BaseLlm;
import com.google.adk.models.Claude;
import com.google.adk.models.Model;
import com.google.auth.oauth2.GoogleCredentials;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ModelConfig {

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

    public static BaseLlm getConfiguredModel() {
        String provider = properties.getProperty("model.provider", "gemini");

        return switch (provider.toLowerCase()) {
            case "anthropic" -> createAnthropicModel();
            case "gemini" -> createGeminiModel();
            default -> throw new IllegalArgumentException(
                "Unknown model provider: " + provider + ". Use 'gemini' or 'anthropic'"
            );
        };
    }

    private static BaseLlm createGeminiModel() {
        String modelName = properties.getProperty("model.gemini.name", "gemini-2.5-flash");
        // For Gemini, ADK uses the model name string directly
        // The framework handles the instantiation internally
        return Model.builder().modelName(modelName).build().model().orElseThrow();
    }

    private static Claude createAnthropicModel() {
        String modelName = properties.getProperty("model.anthropic.name", "claude-3-5-sonnet@20240620");
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
        return properties.getProperty("model.provider", "gemini");
    }

    public static String getGeminiModelName() {
        return properties.getProperty("model.gemini.name", "gemini-2.5-flash");
    }

    public static String getAnthropicModelName() {
        return properties.getProperty("model.anthropic.name", "claude-3-5-sonnet@20240620");
    }
}
