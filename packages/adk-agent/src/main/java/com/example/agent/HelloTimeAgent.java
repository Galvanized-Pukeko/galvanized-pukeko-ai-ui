package com.example.agent;

import com.google.adk.agents.BaseAgent;
import com.google.adk.agents.LlmAgent;
import com.google.adk.sessions.VertexAiSessionService;
import com.google.adk.tools.Annotations.Schema;
import com.google.adk.tools.FunctionTool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;

public class HelloTimeAgent {

    private static final Logger log = LoggerFactory.getLogger(HelloTimeAgent.class);

    public static final VertexAiSessionService SESSION_SERVICE = initSessionService();
    public static BaseAgent ROOT_AGENT = initAgent();

    private static BaseAgent initAgent() {
        return LlmAgent.builder()
            .name("hello-time-agent")
            .description("Tells the current time in a specified city")
            .instruction(
                """
                You are a helpful assistant that tells the current time in a city.
                Use the 'getCurrentTime' tool for this purpose.
                """
            )
            .model("gemini-2.5-flash")
            .tools(FunctionTool.create(HelloTimeAgent.class, "getCurrentTime"))
            .build();
    }

    private static VertexAiSessionService initSessionService() {
        log.info("Initializing VertexAiSessionService");
        String project = System.getenv("GOOGLE_CLOUD_PROJECT");
        String location = System.getenv("GOOGLE_CLOUD_LOCATION");
        if (project == null || project.isBlank() || location == null || location.isBlank()) {
            // Fall back to default configuration for local runs.
            log.warn("GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_LOCATION environment variables not set.");
            return new VertexAiSessionService();
        }
        return new VertexAiSessionService(project, location, Optional.empty(), Optional.empty());
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
