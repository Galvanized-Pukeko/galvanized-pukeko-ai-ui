package com.example

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.serialization.json.*
import java.time.Duration
import kotlin.time.Duration.Companion.seconds

fun Application.configureSockets() {
    install(WebSockets) {
        pingPeriod = 15.seconds
        timeout = 15.seconds
        maxFrameSize = Long.MAX_VALUE
        masking = false
    }
    routing {
        webSocket("/") { // websocketSession
            for (frame in incoming) {
                if (frame is Frame.Text) {
                    val text = frame.readText()
                    println("hi!" + text)
                    try {
                        val json = Json { ignoreUnknownKeys = true }
                        val request = json.decodeFromString<JsonRpcRequest>(text)

                        // Handle JSON-RPC request
                        if (request.id != null) {
                            // This is a request that expects a response
                            val response = handleJsonRpcRequest(request)
                            val responseText = json.encodeToString(JsonRpcResponse.serializer(), response)
                            outgoing.send(Frame.Text(responseText))
                        } else {
                            // This is a notification (no response expected)
                            handleJsonRpcNotification(request)
                        }
                    } catch (e: Exception) {
                        // If parsing fails, send error response if possible
                        println("Error processing message: ${e.message}")
                    }
                }
            }
        }
    }
}

private fun handleJsonRpcRequest(request: JsonRpcRequest): JsonRpcResponse {
    return when (request.method) {
        "form_submit" -> {
            // Handle form submission
            val result = buildJsonObject {
                put("success", true)
                put("message", "Form submitted successfully")
            }
            JsonRpcResponse(
                id = request.id!!,
                result = result
            )
        }
        "cancel" -> {
            // Handle cancel request
            val result = buildJsonObject {
                put("success", true)
                put("message", "Operation cancelled")
            }
            JsonRpcResponse(
                id = request.id!!,
                result = result
            )
        }
        else -> {
            // Method not found error
            JsonRpcResponse(
                id = request.id!!,
                error = JsonRpcError(
                    code = -32601,
                    message = "Method not found: ${request.method}"
                )
            )
        }
    }
}

private fun handleJsonRpcNotification(request: JsonRpcRequest) {
    // Handle notifications (no response needed)
    println("Received notification: ${request.method}")
}
