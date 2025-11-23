package com.example.agent;

import com.google.adk.web.AdkWebServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for the UI Agent server.
 * Extends AdkWebServer to inherit all ADK web configuration including
 * resource handlers, view controllers, and bean definitions.
 * Also scans the custom agent package for additional components.
 */
@SpringBootApplication(scanBasePackages = {
    "com.google.adk.web",        // Scan ADK web components
    "com.example.agent"          // Scan custom agent components
})
public class UiAgentApplication extends AdkWebServer {

    public static void main(String[] args) {
        // Set WebSocket buffer size before starting the application
        System.setProperty(
            "org.apache.tomcat.websocket.DEFAULT_BUFFER_SIZE",
            String.valueOf(10 * 1024 * 1024)
        );

        SpringApplication.run(UiAgentApplication.class, args);
    }
}
