interface ChatSession {
    id: string
    appName: string
    userId: string
    state: Record<string, unknown>
    events: unknown[]
    lastUpdateTime: number
}

interface FunctionCall {
    id: string
    name: string
    args: Record<string, unknown>
}

interface FunctionResponse {
    id: string
    name: string
    response: {
        text_output?: Array<{ text: string }>
    }
}

interface ChatMessagePart {
    text?: string
    functionCall?: FunctionCall
    functionResponse?: FunctionResponse
}

interface ChatMessage {
    role: 'user' | 'model'
    parts: ChatMessagePart[]
}

interface ChatResponse {
    id: string
    invocationId: string
    author: string
    content: ChatMessage
    actions: {
        stateDelta: Record<string, unknown>
        artifactDelta: Record<string, unknown>
        requestedAuthConfigs: Record<string, unknown>
    }
    timestamp: number
}

interface CompleteChatResponse {
    chunks: ChatResponse[]
    finalMessage: ChatResponse
}

class ChatService {
    private baseUrl: string = 'http://localhost:8080'

    async createSession(userId: string = 'user'): Promise<ChatSession> {
        console.log('[ChatService] Creating session for user:', userId)
        const url = `${this.baseUrl}/apps/pukeko-ui-agent/users/${userId}/sessions`
        console.log('[ChatService] Request URL:', url)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*'
                }
            })

            console.log('[ChatService] Response status:', response.status, response.statusText)

            if (!response.ok) {
                throw new Error(`Failed to create session: ${response.statusText}`)
            }

            const data = await response.json()
            console.log('[ChatService] Session created:', data)
            return data
        } catch (error) {
            console.error('[ChatService] Error creating session:', error)
            throw error
        }
    }

    async sendMessage(sessionId: string, text: string, userId: string = 'user'): Promise<CompleteChatResponse> {
        console.log('[ChatService] Sending message:', { sessionId, text, userId })

        const payload = {
            appName: 'pukeko-ui-agent',
            userId,
            sessionId,
            newMessage: {
                role: 'user',
                parts: [{ text }]
            },
            streaming: false,
            stateDelta: null
        }

        console.log('[ChatService] Request payload:', JSON.stringify(payload, null, 2))
        const url = `${this.baseUrl}/run_sse`
        console.log('[ChatService] Request URL:', url)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'text/event-stream',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            console.log('[ChatService] Response status:', response.status, response.statusText)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('[ChatService] Error response:', errorText)
                throw new Error(`Failed to send message: ${response.statusText}`)
            }

            // Response is in SSE format: "data:{json}\n\n"
            const responseText = await response.text()
            console.log('[ChatService] Raw response:', responseText)

            // Parse SSE format - extract all JSON chunks from "data:" prefix
            const lines = responseText.trim().split('\n')
            const chunks: ChatResponse[] = []

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim() // Remove "data:" prefix
                    const data = JSON.parse(jsonStr) as ChatResponse
                    console.log('[ChatService] Parsed chunk:', data)
                    chunks.push(data)
                }
            }

            if (chunks.length === 0) {
                throw new Error('No data found in SSE response')
            }

            // The last chunk with text content is the final message
            let finalMessage = chunks[chunks.length - 1]

            // Find the last chunk that has actual text (not just function calls/responses)
            for (let i = chunks.length - 1; i >= 0; i--) {
                const chunk = chunks[i]
                if (chunk.content.parts && chunk.content.parts.some(p => p.text && p.text.trim().length > 0)) {
                    finalMessage = chunk
                    break
                }
            }

            console.log('[ChatService] Final message:', finalMessage)
            console.log('[ChatService] Total chunks:', chunks.length)

            return {
                chunks,
                finalMessage
            }
        } catch (error) {
            console.error('[ChatService] Error sending message:', error)
            throw error
        }
    }
}

export const chatService = new ChatService()
export type { ChatSession, ChatResponse, ChatMessage, CompleteChatResponse, ChatMessagePart }

