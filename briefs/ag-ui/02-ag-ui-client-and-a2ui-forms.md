# AG-UI Client Upgrade and A2UI Forms for Pukeko

## Goal

1. Replace the naive AG-UI client in the Vue UI with the proper `@ag-ui/client` `HttpAgent`
   library for real-time SSE streaming and correct tool call event handling.
2. Add tool call event emission to the Gaunt Sloth AG-UI server so `TOOL_CALL_*` events
   are streamed to the client.
3. Build a Vue A2UI renderer so agents can render interactive forms in the Pukeko browser UI.
4. Add a `show_a2ui_surface` built-in tool to Gaunt Sloth that the LLM can use to display
   A2UI surfaces.
5. Migrate the ADK Java agent from the custom WebSocket form protocol to A2UI.

Both the ADK Java backend and the Gaunt Sloth AG-UI server must work correctly with the Vue
UI. The integration test suite is the acceptance gate.

> **Compatibility:** The Vue UI and Gaunt Sloth `api` command are version 0 (experimental).
> No backwards compatibility is required. Breaking changes are allowed. The test suite, not
> legacy code paths, defines what must keep working.

## Read-only references

- ADK Java agent: `./packages/galvanized-pukeko-agent-adk`
- Vue UI source: `./packages/galvanized-pukeko-vue-ui`
- Web client host: `./packages/galvanized-pukeko-web-client`
- Gaunt Sloth AG-UI server: `./packages/gaunt-sloth-assistant/src/modules/apiAgUiModule.ts`
- Gaunt Sloth agent core: `./packages/gaunt-sloth-assistant/src/core/GthLangChainAgent.ts`
- AG-UI TypeScript SDK: `./_readonly/ag-ui/sdks/typescript/`
  - Client library: `packages/client/src/agent/` (`agent.ts`, `http.ts`, `subscriber.ts`)
  - Core types and events: `packages/core/src/`
- A2UI specification v0.8: `./_readonly/A2UI/specification/v0_8/docs/a2ui_protocol.md`
- A2UI web_core renderer: `./_readonly/A2UI/renderers/web_core/src/v0_8/`
  - Message processor: `data/model-processor.ts` — **port this into Vue composable**
  - Type definitions: `types/types.ts`
- A2UI Angular renderer (reference): `./_readonly/A2UI/renderers/angular/src/lib/`

## Technical Details

- Vue UI uses Vite + Vue 3 Composition API + TypeScript; no RxJS currently — adding
  `@ag-ui/client` brings RxJS as a transitive dependency; this is acceptable.
- `@ag-ui/client`, `@ag-ui/core`, `@ag-ui/encoder` versions must be kept in sync
  (currently `^0.0.46` in Gaunt Sloth; match this in Vue UI).
- AG-UI Java community library is already vendored into the ADK project as temporary copies.
- Use `./mvnw` for any Java builds (global Maven unavailable).
- Use workspaces for any new root `package.json` scripts.

## Implementation Phases

### Phase 1 — Vue AG-UI Client (replace naive implementation)

- [x] Phase 1 is complete.

**Problem:** `chatService.ts` calls `await response.text()` (blocks until full stream) and
manually parses SSE. Only TEXT_MESSAGE_* and RUN_ERROR events are handled. No real-time
streaming.

**Changes:**

`packages/galvanized-pukeko-vue-ui/package.json`
- Add `"@ag-ui/client": "^0.0.46"` to `dependencies`

`packages/galvanized-pukeko-vue-ui/src/services/chatService.ts` — rewrite
- Instantiate `HttpAgent` (`@ag-ui/client`) with `url: config.agUiUrl` and managed `threadId`
- Implement `AgentSubscriber`:
  - `onTextMessageStartEvent` — open a streaming slot
  - `onTextMessageContentEvent` — append delta to reactive ref for real-time display
  - `onTextMessageEndEvent` — finalize message into history
  - `onToolCallStartEvent` — store `{ toolCallId, toolCallName }`
  - `onToolCallArgsEvent` — accumulate `toolCallBuffer`
  - `onToolCallEndEvent` — if tool name is `show_a2ui_surface`, dispatch to A2UI composable
  - `onRunErrorEvent` — propagate error
- Add `submitToolResult(toolCallId: string, content: string): Promise<void>` for Phase 3
- Expose real-time delta via callback or reactive ref to `ChatInterface.vue`

`packages/galvanized-pukeko-vue-ui/src/components/ChatInterface.vue`
- Add `streamingMessage` reactive ref (`{ id, text } | null`)
- Display it in the message list with a typing indicator while in-flight
- Finalize to `messages` array on `TEXT_MESSAGE_END`

**Acceptance:** `npm run it-adk` and `npm run it-gth` both pass; text streams in real time.

---

### Phase 2 — Tool Call Events from Gaunt Sloth Server

- [x] Phase 2 is complete.

**Problem:** `apiAgUiModule.ts` only emits text events. The LangGraph stream loop in
`GthLangChainAgent.stream()` silently drops `AIMessage.tool_calls` and `ToolMessage` results.

**Changes:**

`packages/gaunt-sloth-assistant/src/core/GthLangChainAgent.ts`
- Add `streamWithEvents(messages, runConfig)` yielding a discriminated union:
  ```ts
  type AgentStreamEvent =
    | { type: 'text'; delta: string }
    | { type: 'tool_start'; id: string; name: string }
    | { type: 'tool_args'; id: string; delta: string }
    | { type: 'tool_end'; id: string }
    | { type: 'tool_result'; id: string; content: string }
  ```
- In the existing loop at line 232, extend to handle:
  - `AIMessage` with `tool_calls.length > 0` → yield `tool_start` + `tool_args` + `tool_end`
    per call (args serialized as JSON string)
  - `ToolMessage` (import from `@langchain/core/messages`) → yield `tool_result`

`packages/gaunt-sloth-assistant/src/modules/apiAgUiModule.ts`
- Replace `agent.stream()` with `agent.streamWithEvents()`
- Defer `TEXT_MESSAGE_START` until the first `text` event (don't emit it before the loop)
- Map each event type to the corresponding AG-UI `EventType.*` emission
- Emit `TEXT_MESSAGE_END` only if a text message was started
- Add `'tool'` case to `convertMessage()` returning `ToolMessage` (for Phase 3)

`packages/gaunt-sloth-assistant/integration-tests/apiAgUiServer.it.ts`
- Add test: send a message that triggers a tool call; assert `TOOL_CALL_START` and
  `TOOL_CALL_END` are present in the SSE stream

**Acceptance:** `npm run it-gth` passes including the new tool call test.

---

### Phase 3 — Vue A2UI Renderer

**Goal:** Vue renders declarative A2UI surfaces delivered via `TOOL_CALL_ARGS` events.
User actions (button clicks, form submits) are returned to the agent as tool results.

**Tool result return channel:** Submit the tool result as a `role: 'tool'` message in the
next AG-UI run payload. The `convertMessage()` function in `apiAgUiModule.ts` (Phase 2)
handles this on the server. This is the cleanest approach without requiring a new endpoint.

**A2UI message processor:** Port `A2uiMessageProcessor` from
`_readonly/A2UI/renderers/web_core/src/v0_8/data/model-processor.ts` — it is
framework-agnostic. Wrap in Vue reactive state in the composable.

**New: `packages/galvanized-pukeko-vue-ui/src/composables/useA2UI.ts`**
- Wraps `A2uiMessageProcessor` with Vue reactivity
- `surfaces: reactive Map<string, Surface>` — triggers re-render on update
- `processBatch(messages: ServerToClientMessage[]): void`
- `sendAction(surfaceId, action, sourceComponentId): void` — serializes `userAction` to JSON,
  calls `chatService.submitToolResult(pendingToolCallId, json)`
- `pendingToolCallId` tracked from chatService subscriber

**New: `packages/galvanized-pukeko-vue-ui/src/components/a2ui/`**

| Component | Purpose |
|-----------|---------|
| `A2UISurface.vue` | Root surface; `provide()`s `A2UIContext`; renders via `A2UIRenderer` |
| `A2UIRenderer.vue` | Dynamic dispatch hub; `<component :is="catalog[node.type]">` |
| `A2UIText.vue` | Text node with `usageHint` → heading/body/caption |
| `A2UIButton.vue` | Button; calls `inject(A2UIContextKey).sendAction()` on click |
| `A2UIRow.vue` | Horizontal layout; renders `children` via `A2UIRenderer` |
| `A2UIColumn.vue` | Vertical layout; renders `children` via `A2UIRenderer` |
| `A2UITextField.vue` | `<input>` bound to data model via `setData()` |
| `catalog.ts` | `Record<string, Component>` — maps type string to Vue component |

**MVP catalog:** Text, Button, Row, Column, TextField
**Stretch catalog:** CheckBox, MultipleChoice, Slider, Image, Card, Tabs, Modal, Divider

**Modified: `packages/galvanized-pukeko-vue-ui/src/services/chatService.ts`** (Phase 1 ext.)
- `onToolCallEndEvent`: if `toolCallName === 'show_a2ui_surface'`, parse `toolCallBuffer`
  as JSONL and call `useA2UI.processBatch()`
- `submitToolResult`: push `ToolMessage` to `agent.messages`, call `agent.runAgent()`

**Modified: `packages/galvanized-pukeko-vue-ui/src/CoreApp.vue`**
- Render `<A2UISurface>` for each active surface in the right panel

**Data flow:**
```
Agent → TOOL_CALL_START (show_a2ui_surface)
      → TOOL_CALL_ARGS  (A2UI JSONL: surfaceUpdate + dataModelUpdate + beginRendering)
      → TOOL_CALL_END

chatService (onToolCallEndEvent)
  → parse JSONL → useA2UI.processBatch()

useA2UI → A2uiMessageProcessor.processMessages() → surfaces map updated → Vue renders

User clicks Button
  → A2UIButton.sendAction()
  → useA2UI resolves BoundValues → serializes userAction JSON
  → chatService.submitToolResult(toolCallId, json)
  → ToolMessage pushed → agent.runAgent() → agent continues
```

**Acceptance:**
- Unit tests for `useA2UI` composable verify `processMessages()` builds correct surface state
- Playwright test (needs Phase 4): trigger form, fill field, click button, verify agent
  receives and acknowledges the action

---

### Phase 4 — `show_a2ui_surface` Tool in Gaunt Sloth

**New: `packages/gaunt-sloth-assistant/src/tools/ShowA2UISurfaceTool.ts`**
```ts
tool(
  z.object({ surfaceJsonl: z.string().describe('A2UI JSONL payload (newline-separated JSON objects: surfaceUpdate, dataModelUpdate, beginRendering)') }),
  async ({ surfaceJsonl }) => surfaceJsonl,
  { name: 'show_a2ui_surface' }
)
```
The tool simply returns the JSONL string — the Gaunt Sloth server emits it as `TOOL_CALL_ARGS`
and the Vue client parses it to render the surface.

**Modified: `packages/gaunt-sloth-assistant/src/builtInToolsConfig.ts`**
- Register `ShowA2UISurfaceTool` for the `api` command (or behind `builtInTools.a2uiForms`)

**Modified: integration test workdir config**
- Enable the tool in test config so integration tests can exercise it

**Modified: `packages/gaunt-sloth-assistant/integration-tests/apiAgUiServer.it.ts`**
- Add test: send message that triggers `show_a2ui_surface`; assert `TOOL_CALL_ARGS` delta
  contains `surfaceUpdate` or `beginRendering`

**Acceptance:** `npm run it-gth` passes. Full Playwright E2E (Phase 3 + 4 together) confirms
end-to-end form rendering and action submission.

---

### Phase 5 — ADK Agent A2UI Migration (replace WebSocket forms)

**Goal:** Replace the custom WebSocket form protocol in the ADK Java agent with `show_a2ui_surface`,
so the ADK agent renders interactive surfaces via the same A2UI path as Gaunt Sloth.
The WebSocket status badge is removed from the Vue UI as it becomes irrelevant.

**Problem:** `UiAgent.java` has three WebSocket-backed tools (`renderForm`, `renderChart`,
`renderTable`) that broadcast via `FormWebSocketHandler`. The Vue UI connects to a WebSocket
(`connectionService.ts`) and renders forms/charts/tables directly in `CoreApp.vue`. This
whole path is replaced by A2UI.

**Background:** `renderChart` and `renderTable` have no A2UI equivalent in the MVP catalog.
They are removed in this phase. Chart and table rendering may be added later as A2UI stretch
components.

#### ADK Java changes

`packages/galvanized-pukeko-agent-adk/src/main/java/io/github/galvanized_pukeko/UiAgent.java`
- Remove `renderForm`, `renderChart`, `renderTable` tool registrations and their method implementations
- Remove static `webSocketHandler` field and all references to it
- Add `show_a2ui_surface` as a `FunctionTool` — takes a single `surfaceJsonl: String` parameter
  and returns it unchanged; the AG-UI streamer emits it as `TOOL_CALL_ARGS`

`packages/galvanized-pukeko-agent-adk/src/main/java/io/github/galvanized_pukeko/FormWebSocketHandler.java`
- Delete this file

`packages/galvanized-pukeko-agent-adk/src/main/java/io/github/galvanized_pukeko/FormWebSocketConfigurer.java`
- Delete this file

`packages/galvanized-pukeko-agent-adk/src/main/resources/application.properties` (if referenced)
- Remove any WebSocket-specific configuration

#### Vue UI changes

`packages/galvanized-pukeko-vue-ui/src/CoreApp.vue`
- Remove the `wsStatus` badge (`<span class="status-badge">WebSockets {{ wsStatus }}</span>`)
  from the nav-controls slot
- Remove all WebSocket-driven state: `serverComponents`, `formLabels`, `wsStatus`,
  `currentChart`, `currentTable`, `componentValues`
- Remove all WebSocket message handlers: `handleRenderComponents`, `handleChartMessage`,
  `handleTableMessage`, `handleSubmit`, `handleCancel`, `handleClearChart`, `handleClearTable`
- Remove `connectionService` import and all `onMounted`/`onUnmounted` WebSocket lifecycle
- Remove the form, chart, and table rendering sections from the right panel
- Add A2UI surface rendering in the right panel:
  `<A2UISurface v-for="[id, surface] in a2ui.surfaces" :key="id" :surface="surface" />`
- Wire `useA2UI` composable and pass it to `ChatInterface` (or provide it globally)

`packages/galvanized-pukeko-vue-ui/src/services/connectionService.ts`
- Delete this file (no longer needed)

`packages/galvanized-pukeko-vue-ui/src/types/jsonrpc.ts` (if it only serves connectionService)
- Delete if no other consumers

#### Playwright E2E test changes

`e2e/chat.spec.ts`
- Remove `should render form when requested` test (old WebSocket form path gone)
- Remove `should render chart when requested with data` test (chart tool removed)
- Add `should render A2UI form when requested` test: ask agent to show a contact form,
  assert an A2UI surface appears in the right panel with expected fields, fill a field,
  click submit, verify agent receives and acknowledges the submission

#### ADK agent prompt update

`packages/galvanized-pukeko-agent-adk/src/main/resources/` (agent prompt file)
- Update instructions to describe `show_a2ui_surface` instead of `renderForm`/`renderChart`/`renderTable`
- Document the A2UI JSONL format (surfaceUpdate + dataModelUpdate + beginRendering)

**Acceptance:**
- `npm run it-adk` passes — ADK integration tests pass with A2UI form rendering
- WebSocket status badge is absent from the UI
- `connectionService.ts` is deleted
- `FormWebSocketHandler.java` and `FormWebSocketConfigurer.java` are deleted
- Agent can render an A2UI form; user can fill and submit it; agent continues

---

## Criteria

- `npm run it-adk` passes — Pukeko works correctly with the ADK Java backend
- `npm run it-gth` passes — Pukeko works correctly with the Gaunt Sloth AG-UI server
- Text streams in real time (no blocking until end of response)
- Agent can render an A2UI form via `show_a2ui_surface`; user can interact and submit
- WebSocket status badge removed from the Vue UI nav header
- `connectionService.ts` deleted; `FormWebSocketHandler.java` and `FormWebSocketConfigurer.java` deleted
- No backwards compatibility obligations beyond what integration tests require
