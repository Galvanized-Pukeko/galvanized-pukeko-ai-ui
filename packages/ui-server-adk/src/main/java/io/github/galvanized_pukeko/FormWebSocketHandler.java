package io.github.galvanized_pukeko;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class FormWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(FormWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        log.info("WebSocket connection established: {}", session.getId());
        sessions.put(session.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            JsonNode request = objectMapper.readTree(message.getPayload());
            log.info("Received JSON-RPC request: {}", request);

            // Validate JSON-RPC format
            if (!request.has("jsonrpc") || !request.has("method")) {
                sendError(session, request.has("id") ? request.get("id") : null, 
                         -32600, "Invalid Request");
                return;
            }

            String method = request.get("method").asText();
            JsonNode params = request.get("params");
            JsonNode id = request.get("id");

            switch (method) {
                case "form_submit":
                    handleFormSubmit(session, params, id);
                    break;
                case "cancel":
                    handleCancel(session, params, id);
                    break;
                default:
                    sendError(session, id, -32601, "Method not found");
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message", e);
            sendError(session, null, -32700, "Parse error");
        }
    }

    private void handleFormSubmit(WebSocketSession session, JsonNode params, JsonNode id) {
        log.info("Form submitted: {}", params);
        // TODO: Process form data with agent session
        sendResponse(session, id, Map.of("success", true));
    }

    private void handleCancel(WebSocketSession session, JsonNode params, JsonNode id) {
        log.info("Form cancelled");
        sendResponse(session, id, Map.of("success", true));
    }

    private void sendResponse(WebSocketSession session, JsonNode id, Object result) {
        if (id == null) return; // Notification, no response needed
        
        try {
            ObjectNode response = objectMapper.createObjectNode();
            response.put("jsonrpc", "2.0");
            response.set("id", id);
            response.set("result", objectMapper.valueToTree(result));
            session.sendMessage(new TextMessage(response.toString()));
        } catch (IOException e) {
            log.error("Error sending response", e);
        }
    }

    private void sendError(WebSocketSession session, JsonNode id, int code, String message) {
        try {
            ObjectNode response = objectMapper.createObjectNode();
            response.put("jsonrpc", "2.0");
            if (id != null) response.set("id", id);
            ObjectNode error = objectMapper.createObjectNode();
            error.put("code", code);
            error.put("message", message);
            response.set("error", error);
            session.sendMessage(new TextMessage(response.toString()));
        } catch (IOException e) {
            log.error("Error sending error response", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        log.info("WebSocket connection closed: {}", session.getId());
        sessions.remove(session.getId());
    }

    // Broadcast form to all connected clients
    public void broadcastForm(Map<String, Object> formData) {
        try {
            ObjectNode notification = objectMapper.createObjectNode();
            notification.put("jsonrpc", "2.0");
            notification.put("method", "form");
            notification.set("params", objectMapper.valueToTree(formData));
            
            String message = notification.toString();
            sessions.values().forEach(session -> {
                try {
                    if (session.isOpen()) {
                        session.sendMessage(new TextMessage(message));
                    }
                } catch (IOException e) {
                    log.error("Error broadcasting to session {}", session.getId(), e);
                }
            });
        } catch (Exception e) {
            log.error("Error broadcasting form", e);
        }
    }
}
