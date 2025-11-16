package com.example.agent.web;

import com.example.agent.HelloTimeAgent;
import com.google.adk.sessions.BaseSessionService;
import com.google.adk.web.AdkWebServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;

/**
 * Custom entry point that reuses {@link AdkWebServer} but swaps the session service for the
 * Vertex-backed implementation exposed by {@link HelloTimeAgent}.
 */
@SpringBootApplication(scanBasePackages = {"com.google.adk.web"})
@ConfigurationPropertiesScan(basePackages = {"com.google.adk"})
public class VertexAdkWebServer extends AdkWebServer {

    private static final Logger logger = LoggerFactory.getLogger(VertexAdkWebServer.class);

    public static void main(String[] args) {
        System.setProperty(
            "org.apache.tomcat.websocket.DEFAULT_BUFFER_SIZE", String.valueOf(10 * 1024 * 1024));
        SpringApplication.run(VertexAdkWebServer.class, args);
        logger.info("VertexAdkWebServer application started successfully.");
    }

    @Override
    @Bean
    public BaseSessionService sessionService() {
        logger.info("Using VertexAdkWebServer.sessionService()");
        return HelloTimeAgent.SESSION_SERVICE;
    }
}
