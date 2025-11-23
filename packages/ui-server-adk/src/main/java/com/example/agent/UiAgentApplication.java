package com.example.agent;

import com.google.adk.web.AdkWebServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

/**
 * Main application class for the UI Agent server.
 * This class configures Spring Boot to scan both the ADK package and the custom agent package.
 */
@SpringBootApplication(scanBasePackages = {
    "com.google.adk.web",        // Scan ADK web components
    "com.example.agent"          // Scan custom agent components
})
@Import(AdkWebServer.class)      // Explicitly import ADK web server configuration
public class UiAgentApplication {

    public static void main(String[] args) {
        // Set WebSocket buffer size before starting the application
        System.setProperty(
            "org.apache.tomcat.websocket.DEFAULT_BUFFER_SIZE",
            String.valueOf(10 * 1024 * 1024)
        );

        SpringApplication.run(UiAgentApplication.class, args);
    }
}
