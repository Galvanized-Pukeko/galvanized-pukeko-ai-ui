package io.github.galvanized_pukeko;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration for custom form handlers.
 * This configuration is separate from the ADK's WebSocketConfig to avoid bean name conflicts.
 */
@Configuration
@EnableWebSocket
public class FormWebSocketConfigurer implements WebSocketConfigurer {

    private final FormWebSocketHandler formWebSocketHandler;

    public FormWebSocketConfigurer(FormWebSocketHandler formWebSocketHandler) {
        this.formWebSocketHandler = formWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(formWebSocketHandler, "/ws")
                .setAllowedOrigins("*"); // Configure CORS as needed
    }
}
