interface ChatSession {
    id: string
    appName: string
    userId: string
    state: Record<string, unknown>
    events: unknown[]
    lastUpdateTime: number
}

interface ChatMessagePart {
    text: string
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

class ChatService {
    private baseUrl: string = 'http://localhost:8080'

    async createSession(userId: string = 'user'): Promise<ChatSession> {
        console.log('[ChatService] Creating session for user:', userId)
        const url = `${this.baseUrl}/apps/ui-agent/users/${userId}/sessions`
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

    async sendMessage(sessionId: string, text: string, userId: string = 'user'): Promise<ChatResponse> {
        console.log('[ChatService] Sending message:', { sessionId, text, userId })

        const payload = {
            appName: 'ui-agent',
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

            // Parse SSE format - extract JSON from "data:" prefix
            const lines = responseText.trim().split('\n')
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim() // Remove "data:" prefix
                    const data = JSON.parse(jsonStr)
                    console.log('[ChatService] Message response:', data)
                    return data
                }
            }

            throw new Error('No data found in SSE response')
        } catch (error) {
            console.error('[ChatService] Error sending message:', error)
            throw error
        }
    }
}

export const chatService = new ChatService()
export type { ChatSession, ChatResponse, ChatMessage }
