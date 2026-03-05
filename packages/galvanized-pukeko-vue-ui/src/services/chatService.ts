import { configService } from './configService'

interface AgUiMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'developer'
  content: string
}

interface AgUiEvent {
  type: string
  threadId?: string
  runId?: string
  messageId?: string
  role?: string
  delta?: string
  message?: string
  [key: string]: unknown
}

interface ChatResponse {
  messageId: string
  text: string
}

class ChatService {
  private threadId: string = crypto.randomUUID()
  private messages: AgUiMessage[] = []

  /**
   * Reset the conversation (new thread)
   */
  resetThread(): void {
    this.threadId = crypto.randomUUID()
    this.messages = []
  }

  getThreadId(): string {
    return this.threadId
  }

  async sendMessage(text: string): Promise<ChatResponse> {
    console.log('[ChatService] Sending message:', text)

    // Add user message to history
    const userMessage: AgUiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    this.messages.push(userMessage)

    const config = configService.get()
    const runId = crypto.randomUUID()

    const payload = {
      threadId: this.threadId,
      runId,
      messages: this.messages,
      tools: [],
      context: [],
      state: null,
      forwardedProps: null,
    }

    console.log('[ChatService] AG-UI request to:', config.agUiUrl)

    try {
      const response = await fetch(config.agUiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[ChatService] Error response:', errorText)
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      // Parse SSE response
      const responseText = await response.text()
      console.log('[ChatService] Raw response length:', responseText.length)

      const events = this.parseSSE(responseText)

      // Accumulate text content from TEXT_MESSAGE_CONTENT events
      let messageId = ''
      let fullText = ''
      let hasError = false
      let errorMessage = ''

      for (const event of events) {
        switch (event.type) {
          case 'TEXT_MESSAGE_START':
            messageId = event.messageId || crypto.randomUUID()
            break
          case 'TEXT_MESSAGE_CONTENT':
            if (event.delta) {
              fullText += event.delta
            }
            break
          case 'TEXT_MESSAGE_END':
            break
          case 'RUN_ERROR':
            hasError = true
            errorMessage = event.message || 'Unknown error'
            break
        }
      }

      if (hasError) {
        throw new Error(errorMessage)
      }

      // Add assistant message to history
      if (fullText) {
        this.messages.push({
          id: messageId || crypto.randomUUID(),
          role: 'assistant',
          content: fullText,
        })
      }

      console.log('[ChatService] Response text length:', fullText.length)

      return {
        messageId: messageId || crypto.randomUUID(),
        text: fullText,
      }
    } catch (error) {
      console.error('[ChatService] Error sending message:', error)
      // Remove the user message we added since the request failed
      this.messages.pop()
      throw error
    }
  }

  private parseSSE(text: string): AgUiEvent[] {
    const events: AgUiEvent[] = []
    const lines = text.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.substring(5).trim()
        if (jsonStr) {
          try {
            events.push(JSON.parse(jsonStr) as AgUiEvent)
          } catch (e) {
            console.warn('[ChatService] Failed to parse SSE event:', jsonStr)
          }
        }
      }
    }

    return events
  }
}

export const chatService = new ChatService()
export type { AgUiMessage, AgUiEvent, ChatResponse }
