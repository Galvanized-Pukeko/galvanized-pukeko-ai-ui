# Components & API reference

Everything below is exported from the package root:

```ts
import { CoreApp, ChatInterface, PkForm, chatService, configService /* … */ } from '@galvanized-pukeko/vue-ui'
import '@galvanized-pukeko/vue-ui/style.css'
```

## App

| Export | Description |
|--------|-------------|
| `CoreApp` | The complete app: nav header, chat panel, and the content area where agent-rendered components and A2UI surfaces appear. Drop-in — see [getting-started.md](./getting-started.md). |
| `ChatInterface` | Just the chat panel: message history, streaming text/reasoning, tool-call badges, and the progress bar. Exposes `sendFormMessage()` and `clearHistory()` via `defineExpose`. |

## Layout & chrome

| Component | Description |
|-----------|-------------|
| `PkNavHeader` | Top navigation bar with `logo`, `nav-links`, and `nav-controls` slots. |
| `PkNavItem` | A single nav entry. |
| `PkLogo` / `PkLogoLarge` | Pukeko logo marks. |
| `PkProgressBar` | Slim activity bar driven by `runState` / `statusText`. |

## Widgets the agent (or you) can render

| Component | Description |
|-----------|-------------|
| `PkForm` | Form container with submit handling. |
| `PkInput` | Text input. |
| `PkSelect` | Dropdown. |
| `PkCheckbox` | Checkbox. |
| `PkRadio` | Radio button. |
| `PkInputCounter` | Numeric counter with +/-. |
| `PkButton` | Action button. |
| `PkBarChart` / `PkPieChart` | Charts (Chart.js). |
| `PkTable` | Data table. |
| `PkWebcamPanel` | Webcam capture panel (e.g. for vision/robotics clients). |

## A2UI surfaces

When the agent calls the `show_a2ui_surface` tool, `CoreApp` renders the returned
[A2UI](https://github.com/google/A2UI) document — text, rows/columns, text fields and buttons —
into the content area, and submits user interactions back to the agent. This is handled internally;
you don't wire it up manually when using `CoreApp`.

## Services

### `configService`

Loads runtime configuration — see [configuration.md](./configuration.md).

### `chatService`

Drives the AG-UI run loop. Key surface:

```ts
import { chatService, runState, statusText } from '@galvanized-pukeko/vue-ui'
import type { RunState, ChatCallbacks } from '@galvanized-pukeko/vue-ui'

chatService.sendMessage(text, callbacks, { tools })   // start a run
chatService.submitToolResult(/* … */)                 // return a client-tool result
chatService.resumeWithCommand(/* … */)                // resume after a client tool
chatService.resetThread()                             // new conversation (rotates thread id)
chatService.getThreadId()
```

- `runState: Ref<RunState>` — `'idle' | 'streaming' | 'running-tool' | 'waiting'`.
- `statusText: Ref<string>` — human-readable status for the progress bar.
- `ChatCallbacks` — the AG-UI event handlers (`onMessageUpdate`, `onToolCallStart`,
  `onToolCallEnd`, `onToolCallResult`, `onError`, …) for driving a custom chat UI.

### Client tools

Pass `tools` to `sendMessage` and provide handlers; when the agent calls one, `ChatInterface`
runs your handler and resumes the run with the result. This is how browser-side capabilities
(camera, geolocation, robot motion, …) are exposed to the agent. See the
[robot controller](https://github.com/andruhon/pukeko-robot-controller) for a worked example.
