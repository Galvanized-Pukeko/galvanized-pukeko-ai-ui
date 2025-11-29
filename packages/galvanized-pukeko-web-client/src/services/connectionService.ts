import { JsonRpcRequest, JsonRpcResponse, JsonRpcNotification } from '../types/jsonrpc.js'

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

interface ComponentConfig {
  type: string
  label: string
  options?: string[]
  value?: string
}

interface WebSocketMessage {
  type: string
  components?: ComponentConfig[]
  submitLabel?: string
  cancelLabel?: string
  [key: string]: unknown
}

type MessageHandler = (message: WebSocketMessage) => void
type StatusHandler = (status: ConnectionStatus) => void

interface PendingRequest {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
}

import { configService } from './configService'

class ConnectionService {
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private statusHandlers: Set<StatusHandler> = new Set()
  private currentStatus: ConnectionStatus = 'disconnected'
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private requestId = 0
  private pendingRequests: Map<string | number, PendingRequest> = new Map()

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.updateStatus('connecting')
    const config = configService.get()
    this.ws = new WebSocket(config.wsUrl)

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server')
      this.updateStatus('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Check if it's a JSON-RPC response
        if (data.jsonrpc === '2.0' && data.id !== undefined) {
          this.handleJsonRpcResponse(data as JsonRpcResponse)
        }
        // Check if it's a JSON-RPC notification
        else if (data.jsonrpc === '2.0' && data.method) {
          this.handleJsonRpcNotification(data as JsonRpcNotification)
        }
        // Fall back to legacy message format
        else {
          this.handleMessage(data as WebSocketMessage)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server')
      this.updateStatus('disconnected')
      this.cleanupPendingRequests()
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
    this.cleanupPendingRequests()
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

  sendJsonRpcRequest(method: string, params?: object | unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket is not connected'))
        return
      }

      const id = ++this.requestId
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        method,
        params,
        id
      }

      this.pendingRequests.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(request))
    })
  }

  sendJsonRpcNotification(method: string, params?: object | unknown[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const notification: JsonRpcNotification = {
        jsonrpc: '2.0',
        method,
        params
      }
      this.ws.send(JSON.stringify(notification))
    } else {
      console.warn('WebSocket is not connected. Notification not sent:', method)
    }
  }

  // Convenience methods for common operations
  submitForm(data: Record<string, unknown>, timestamp?: number): Promise<unknown> {
    return this.sendJsonRpcRequest('form_submit', {
      data,
      timestamp: timestamp || Date.now()
    })
  }

  cancelForm(timestamp?: number): Promise<unknown> {
    return this.sendJsonRpcRequest('cancel', {
      timestamp: timestamp || Date.now(),
      id: crypto.randomUUID()
    })
  }

  getStatus(): ConnectionStatus {
    return this.currentStatus
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('Received message:', message);
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message))
    }

    const allHandlers = this.messageHandlers.get('*')
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message))
    }
  }

  private handleJsonRpcResponse(response: JsonRpcResponse): void {
    const pendingRequest = this.pendingRequests.get(response.id)
    if (pendingRequest) {
      this.pendingRequests.delete(response.id)

      if (response.error) {
        const error = new Error(response.error.message)
        Object.assign(error, {
          code: response.error.code,
          data: response.error.data
        })
        pendingRequest.reject(error)
      } else {
        pendingRequest.resolve(response.result)
      }
    }
  }

  private handleJsonRpcNotification(notification: JsonRpcNotification): void {
    // Convert notification to legacy message format for backward compatibility
    const legacyMessage: WebSocketMessage = {
      type: notification.method,
      ...(notification.params as object)
    }
    this.handleMessage(legacyMessage)
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

  private cleanupPendingRequests(): void {
    this.pendingRequests.forEach((request) => {
      request.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()
  }
}

export const connectionService = new ConnectionService()
export type { ConnectionStatus, ComponentConfig, WebSocketMessage }
