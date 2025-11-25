export interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: unknown[] | object
  id?: string | number | null
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  result?: unknown
  error?: JsonRpcError
  id: string | number | null
}

export interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

export interface JsonRpcNotification {
  jsonrpc: '2.0'
  method: string
  params?: unknown[] | object
}