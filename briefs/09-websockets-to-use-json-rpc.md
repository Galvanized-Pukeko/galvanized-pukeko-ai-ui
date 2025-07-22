# Plan: Refactor WebSocket Communication to JSON-RPC 2.0

## 1. Introduction

This document outlines the plan to refactor the existing WebSocket communication to adhere to the JSON-RPC 2.0 specification. This will provide a more structured and standardized way of handling client-server communication.

## 2. Server-Side Changes (`packages/ui-mcp-server-js/src/websocket-server.ts`)

The server will be updated to handle JSON-RPC requests and send JSON-RPC responses.

### 2.1. Request Handling

- The `ws.on('message')` handler will be updated to parse incoming messages as JSON-RPC requests.
- It will validate the request to ensure it has `jsonrpc: '2.0'`, a `method` name, and an optional `id`.
- A router or a switch statement will be used to map the `method` to a specific handler function.

### 2.2. Method Handlers

- The existing `message.type` checks (e.g., `'cancel'`, `'form_submit'`) will be converted to JSON-RPC methods.
- For example, the `'form_submit'` message type will become a `form_submit` method.
- The handler functions will receive the `params` from the JSON-RPC request.

### 2.3. Response Handling

- For requests with an `id`, the server will send a JSON-RPC response object with the same `id`.
- If the method is processed successfully, the response will contain a `result` property.
- If an error occurs, the response will contain an `error` object with `code`, `message`, and optional `data`.

### 2.4. Notifications

- Requests without an `id` will be treated as notifications, and no response will be sent.

## 3. Client-Side Changes (`packages/web/src/services/connectionService.ts`)

The `connectionService` on the client-side will be updated to send JSON-RPC requests and handle the responses.

### 3.1. Sending Requests

- The `sendMessage` method will be replaced with a more specific request method (e.g., `sendRequest`).
- This method will construct a JSON-RPC request object with `jsonrpc: '2.0'`, a `method`, `params`, and a unique `id`.
- A mechanism to generate unique request IDs will be implemented (e.g., a simple counter).

### 3.2. Handling Responses

- The `ws.onmessage` handler will parse incoming messages as JSON-RPC responses.
- It will use the `id` to correlate the response with the original request.
- A `Map` can be used to store pending requests, mapping request IDs to their `resolve` and `reject` promises.
- When a response is received, the corresponding promise will be resolved or rejected based on whether the response contains a `result` or an `error`.

### 3.3. Method Calls

- The client-side service will expose methods that encapsulate the JSON-RPC calls (e.g., `submitForm(data)`).
- These methods will call `sendRequest` and return a promise that resolves with the result from the server.

## 4. Data Structures (Shared)

The following TypeScript interfaces will be defined in a shared file to ensure type safety on both the client and server.

```typescript
// Shared JSON-RPC types

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[] | object;
  id?: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}
```

## 5. Testing

- **Unit Tests:**
  - Server: Test the request parsing, method routing, and response generation.
  - Client: Test the request generation and response handling logic.
- **Integration Tests:**
  - Create a test that sets up a client and server and verifies that they can communicate successfully using the new JSON-RPC protocol.
  - Test various scenarios, including successful method calls, notifications, and error responses.
