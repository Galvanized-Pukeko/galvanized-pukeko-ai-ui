package com.example.agent;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final FormWebSocketHandler formWebSocketHandler;

    public WebSocketConfig(FormWebSocketHandler formWebSocketHandler) {
        this.formWebSocketHandler = formWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(formWebSocketHandler, "/ws")
                .setAllowedOrigins("*"); // Configure CORS as needed
    }
}
