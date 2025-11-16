package com.example.agent;

import com.example.agent.config.ModelConfig;
import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

public class HelloTimeAgent {

    private static final Logger log = LoggerFactory.getLogger(HelloTimeAgent.class);

    public static final BaseAgent ROOT_AGENT = initAgent();

    private static BaseAgent initAgent() {
        var builder = LlmAgent.builder()
            .name("hello-time-agent")
            .description("Tells the current time in a specified city")
            .instruction(
                """
                You are a helpful assistant that tells the current time in a city.
                Use the 'getCurrentTime' tool for this purpose.
                """
            );

        // Configure model based on provider
        String provider = ModelConfig.getModelProvider();
        if ("anthropic".equalsIgnoreCase(provider)) {
            log.info("Initializing Anthropic model");
            builder.model(ModelConfig.createAnthropicModel());
        } else {
            log.info("Initializing Gemini VertexAI model");
            builder.model(ModelConfig.getGeminiModelName());
        }

        return builder
            .tools(FunctionTool.create(HelloTimeAgent.class, "getCurrentTime"))
            .build();
    }

    /** Mock tool implementation */
    @Schema(description = "Get the current time for a given city")
    public static Map<String, String> getCurrentTime(
        @Schema(
            name = "city",
            description = "Name of the city to get the time for"
        ) String city
    ) {
        return Map.of("city", city, "forecast", "The time is 10:30am.");
    }
}
