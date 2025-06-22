type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface ComponentConfig {
  type: string
  label: string
}

interface WebSocketMessage {
  type: string
  components?: ComponentConfig[]
  [key: string]: unknown
}

type MessageHandler = (message: WebSocketMessage) => void
type StatusHandler = (status: ConnectionStatus) => void

class ConnectionService {
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private statusHandlers: Set<StatusHandler> = new Set()
  private currentStatus: ConnectionStatus = 'disconnected'
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private wsUrl: string

  constructor(url: string = 'ws://localhost:3001') {
    this.wsUrl = url
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.updateStatus('connecting')
    this.ws = new WebSocket(this.wsUrl)

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server')
      this.updateStatus('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server')
      this.updateStatus('disconnected')
      this.scheduleReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  subscribeToMessage(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set())
    }

    this.messageHandlers.get(messageType)!.add(handler)

    return () => {
      const handlers = this.messageHandlers.get(messageType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.messageHandlers.delete(messageType)
        }
      }
    }
  }

  subscribeToStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    handler(this.currentStatus)

    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  sendMessage(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message)
    }
  }

  getStatus(): ConnectionStatus {
    return this.currentStatus
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message))
    }

    const allHandlers = this.messageHandlers.get('*')
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message))
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    this.currentStatus = status
    this.statusHandlers.forEach(handler => handler(status))
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.connect()
    }, 3000)
  }
}

export const connectionService = new ConnectionService()
export type { ConnectionStatus, ComponentConfig, WebSocketMessage }