import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonRpcRequest } from '../src/types/jsonrpc.js';

// Mock WebSocket Server and related modules
const _mockServer = {
  request: vi.fn(),
  notification: vi.fn()
};

const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  terminate: vi.fn(),
  readyState: 1, // WebSocket.OPEN
  on: vi.fn(),
  removeAllListeners: vi.fn()
};

const mockWss = {
  on: vi.fn(),
  close: vi.fn()
};

const mockHttpServer = {
  listen: vi.fn(),
  close: vi.fn(),
  on: vi.fn()
};

vi.mock('ws', () => ({
  WebSocketServer: vi.fn(() => mockWss),
  WebSocket: {
    OPEN: 1,
    CONNECTING: 0,
    CLOSING: 2,
    CLOSED: 3
  }
}));

vi.mock('http', () => ({
  createServer: vi.fn(() => mockHttpServer)
}));

vi.mock('../src/utils/console.js', () => ({
  log: vi.fn(),
  error: vi.fn()
}));

describe('WebSocket Server JSON-RPC', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockHttpServer.listen.mockImplementation((port, callback) => {
      if (callback) callback();
    });
  });

  it('should handle valid JSON-RPC request', async () => {
    const { createWebSocketServer } = await import('../src/websocket-server.js');
    
    createWebSocketServer(3001);
    
    // Get the connection handler
    const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')?.[1];
    expect(connectionHandler).toBeDefined();
    
    // Simulate client connection
    connectionHandler(mockWebSocket);
    
    // Get the message handler
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
    expect(messageHandler).toBeDefined();
    
    const validRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'cancel',
      params: { timestamp: 1234567890 },
      id: 1
    };
    
    // Simulate receiving the message
    messageHandler(JSON.stringify(validRequest));
    
    // Should send a successful response
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        result: { success: true }
      })
    );
  });

  it('should handle form_submit JSON-RPC request', async () => {
    const { createWebSocketServer } = await import('../src/websocket-server.js');
    
    createWebSocketServer(3001);
    
    const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')?.[1];
    connectionHandler(mockWebSocket);
    
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
    
    const formRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'form_submit',
      params: { 
        data: { name: 'test', value: 123 },
        timestamp: 1234567890
      },
      id: 2
    };
    
    messageHandler(JSON.stringify(formRequest));
    
    // Should send error response for missing data
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32602,
          message: 'Invalid params'
        }
      })
    );
  });

  it('should handle invalid JSON-RPC request', async () => {
    const { createWebSocketServer } = await import('../src/websocket-server.js');
    
    createWebSocketServer(3001);
    
    const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')?.[1];
    connectionHandler(mockWebSocket);
    
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
    
    const invalidRequest = {
      jsonrpc: '1.0', // Wrong version
      method: 'test'
    };
    
    messageHandler(JSON.stringify(invalidRequest));
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request'
        },
        id: null
      })
    );
  });

  it('should handle method not found', async () => {
    const { createWebSocketServer } = await import('../src/websocket-server.js');
    
    createWebSocketServer(3001);
    
    const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')?.[1];
    connectionHandler(mockWebSocket);
    
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
    
    const unknownMethodRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'unknown_method',
      id: 3
    };
    
    messageHandler(JSON.stringify(unknownMethodRequest));
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      })
    );
  });

  it('should handle notification (no response)', async () => {
    const { createWebSocketServer } = await import('../src/websocket-server.js');
    
    createWebSocketServer(3001);
    
    const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')?.[1];
    connectionHandler(mockWebSocket);
    
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
    
    const notification = {
      jsonrpc: '2.0',
      method: 'cancel',
      params: { timestamp: 1234567890 }
      // no id = notification
    };
    
    messageHandler(JSON.stringify(notification));
    
    // Should not send any response for notifications
    expect(mockWebSocket.send).not.toHaveBeenCalled();
  });

  it('should handle parse error', async () => {
    const { createWebSocketServer } = await import('../src/websocket-server.js');
    
    createWebSocketServer(3001);
    
    const connectionHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')?.[1];
    connectionHandler(mockWebSocket);
    
    const messageHandler = mockWebSocket.on.mock.calls.find(call => call[0] === 'message')?.[1];
    
    // Send invalid JSON
    messageHandler('invalid json');
    
    expect(mockWebSocket.send).toHaveBeenCalledWith(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error'
        },
        id: null
      })
    );
  });
});