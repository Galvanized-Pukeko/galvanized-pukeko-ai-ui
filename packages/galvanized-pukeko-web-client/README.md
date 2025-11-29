# Galvanized Pukeko Web Client

A Vue.js application that provides a chat interface and dynamic component renderer for interacting with LLM-powered agents. The client receives rendering instructions via WebSocket and displays forms, charts, and tables dynamically.

> **Part of the [Galvanized Pukeko](../../README.md) monorepo** - See the root README for project overview and getting started guide.

## Features

- **Chat Interface** - Conversational UI with SSE streaming support
- **Dynamic Forms** - Render forms with various input types on-demand
- **Charts** - Display bar and pie charts using Chart.js
- **Tables** - Render tabular data with headers, footers, and captions
- **Real-time Updates** - WebSocket connection for instant UI rendering
- **Customizable Branding** - Configurable logo, header, and footer

## Getting Started

### Prerequisites

- Node.js 18+

### Development

```bash
npm install
npm run dev
```

The development server runs on `http://localhost:5555` with hot-reload enabled.

### Building

```bash
npm run build
```

### Deploying to Agent ADK

After making changes, deploy the built client to the Agent ADK:

```bash
./deploy-to-adk.sh
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    PkNavHeader                       │   │
│  │  (Logo, Navigation Links, Connection Status)         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────┬───────────────────────────────┐   │
│  │    ChatInterface    │      Content Panel            │   │
│  │    (SSE/HTTP)       │  ┌─────────────────────────┐  │   │
│  │                     │  │ Dynamic Components:     │  │   │
│  │  - User messages    │  │ - PkForm (forms)        │  │   │
│  │  - Agent responses  │  │ - PkBarChart/PkPieChart │  │   │
│  │                     │  │ - PkTable               │  │   │
│  │                     │  └─────────────────────────┘  │   │
│  └─────────────────────┴───────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                      Footer                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
    ┌─────────┐              ┌──────────────┐
    │  HTTP   │              │  WebSocket   │
    │  /SSE   │              │    /ws       │
    └─────────┘              └──────────────┘
```

### Key Services

| Service | Description |
|---------|-------------|
| `connectionService` | WebSocket connection management and message routing |
| `chatService` | HTTP/SSE communication for chat messages |
| `configService` | UI configuration management |

## WebSocket Message Protocol

The web client communicates with the Agent ADK server via WebSocket using JSON-RPC 2.0 protocol.

### Server-to-Client Messages (Notifications)

The server sends JSON-RPC notifications to render UI components. All notifications follow this structure:

```typescript
interface JsonRpcNotification {
  jsonrpc: '2.0'
  method: string      // Message type: 'form', 'chart', 'table'
  params?: object     // Component-specific data
}
```

#### Form Message (`method: 'form'`)

Renders a dynamic form with various input components.

```json
{
  "jsonrpc": "2.0",
  "method": "form",
  "params": {
    "components": [
      {
        "type": "input",
        "label": "Full Name",
        "value": ""
      },
      {
        "type": "input",
        "label": "Email Address",
        "value": ""
      },
      {
        "type": "select",
        "label": "Country",
        "options": ["USA", "UK", "Canada", "Australia"],
        "value": ""
      },
      {
        "type": "checkbox",
        "label": "Subscribe to newsletter"
      },
      {
        "type": "radio",
        "label": "Preferred Contact",
        "value": "email"
      },
      {
        "type": "counter",
        "label": "Quantity",
        "value": "1"
      }
    ],
    "submitLabel": "Submit",
    "cancelLabel": "Cancel"
  }
}
```

**Component Types:**

| Type | Description | Properties |
|------|-------------|------------|
| `input` | Text input field | `label`, `value` (optional default) |
| `select` | Dropdown selection | `label`, `options` (string array), `value` |
| `checkbox` | Boolean checkbox | `label` |
| `radio` | Radio button | `label`, `value` |
| `counter` | Numeric counter input | `label`, `value` |

#### Chart Message (`method: 'chart'`)

Renders a chart visualization using Chart.js.

```json
{
  "jsonrpc": "2.0",
  "method": "chart",
  "params": {
    "chartType": "bar",
    "title": "Monthly Sales Report",
    "data": {
      "labels": ["January", "February", "March", "April"],
      "datasets": [
        {
          "label": "Sales 2024",
          "data": [120, 190, 300, 250],
          "backgroundColor": ["#4299e1", "#48bb78", "#ed8936", "#9f7aea"],
          "borderColor": ["#3182ce", "#38a169", "#dd6b20", "#805ad5"],
          "borderWidth": 1
        }
      ]
    }
  }
}
```

**Chart Types:**
- `bar` - Bar chart
- `pie` - Pie chart

**Data Structure:**
| Field | Type | Description |
|-------|------|-------------|
| `chartType` | `'bar' \| 'pie'` | Type of chart to render |
| `title` | `string` | Chart title |
| `data.labels` | `string[]` | Labels for data points |
| `data.datasets` | `Dataset[]` | Array of datasets |
| `data.datasets[].label` | `string` | Dataset label |
| `data.datasets[].data` | `number[]` | Data values |
| `data.datasets[].backgroundColor` | `string[]` | (Optional) Colors for each data point |
| `data.datasets[].borderColor` | `string[]` | (Optional) Border colors |
| `data.datasets[].borderWidth` | `number` | (Optional) Border width |

#### Table Message (`method: 'table'`)

Renders tabular data.

```json
{
  "jsonrpc": "2.0",
  "method": "table",
  "params": {
    "caption": "Employee Directory",
    "header": ["Name", "Department", "Role", "Location"],
    "data": [
      ["Alice Johnson", "Engineering", "Senior Developer", "New York"],
      ["Bob Smith", "Design", "UX Designer", "San Francisco"],
      ["Carol Williams", "Marketing", "Marketing Manager", "Chicago"]
    ],
    "footer": ["Total Employees", "", "", "3"]
  }
}
```

**Table Structure:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `caption` | `string` | No | Table caption/title |
| `header` | `string[]` | No | Column headers |
| `data` | `string[][]` | Yes | 2D array of row data |
| `footer` | `string[]` | No | Footer row (e.g., totals) |

### Client-to-Server Messages (Requests)

The client sends JSON-RPC requests for user actions:

```typescript
interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: object
  id: string | number
}
```

#### Form Submit (`method: 'form_submit'`)

```json
{
  "jsonrpc": "2.0",
  "method": "form_submit",
  "params": {
    "data": {
      "Full Name": "John Doe",
      "Email Address": "john@example.com",
      "Country": "USA",
      "Subscribe to newsletter": true
    },
    "timestamp": 1699999999999
  },
  "id": 1
}
```

#### Cancel (`method: 'cancel'`)

```json
{
  "jsonrpc": "2.0",
  "method": "cancel",
  "params": {
    "timestamp": 1699999999999,
    "id": "uuid-string"
  },
  "id": 2
}
```

### Server Responses

The server responds to requests with:

```json
{
  "jsonrpc": "2.0",
  "result": { "success": true },
  "id": 1
}
```

Or on error:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  },
  "id": 1
}
```

**Standard Error Codes:**
| Code | Message |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid Request |
| -32601 | Method not found |

## Configuration

The client fetches configuration from the server at `/api/ui-config`:

```typescript
interface UiConfig {
  baseUrl: string      // Base URL for API calls
  wsUrl: string        // WebSocket URL
  appName: string      // Application name for API paths
  logo?: {
    text?: string
    href?: string
    img?: string
  }
  header?: NavItem[]   // Header navigation items
  footer?: NavItem[]   // Footer items
}

interface NavItem {
  text?: string
  href?: string
  img?: string
}
```

## Available Components

| Component | Description |
|-----------|-------------|
| `PkForm` | Form container with submit handling |
| `PkInput` | Text input field |
| `PkSelect` | Dropdown selection |
| `PkCheckbox` | Boolean checkbox |
| `PkRadio` | Radio button |
| `PkInputCounter` | Numeric counter with increment/decrement |
| `PkButton` | Action button |
| `PkBarChart` | Bar chart (Chart.js) |
| `PkPieChart` | Pie chart (Chart.js) |
| `PkTable` | Data table |
| `PkNavHeader` | Navigation header |
| `PkNavItem` | Navigation item |
| `PkLogo` | Logo component |
| `ChatInterface` | Chat UI with message history |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run lint` | Run linting |
| `npm run type-check` | TypeScript type checking |

## Project Structure

```
src/
├── App.vue              # Main application component
├── main.ts              # Application entry point
├── components/          # Vue components
│   ├── ChatInterface.vue
│   ├── PkForm.vue
│   ├── PkInput.vue
│   ├── PkSelect.vue
│   ├── PkCheckbox.vue
│   ├── PkRadio.vue
│   ├── PkInputCounter.vue
│   ├── PkButton.vue
│   ├── PkBarChart.vue
│   ├── PkPieChart.vue
│   ├── PkTable.vue
│   ├── PkNavHeader.vue
│   ├── PkNavItem.vue
│   └── PkLogo.vue
├── services/
│   ├── connectionService.ts  # WebSocket management
│   ├── chatService.ts        # HTTP/SSE chat
│   └── configService.ts      # Configuration
├── types/
│   └── jsonrpc.ts           # JSON-RPC type definitions
└── assets/
    └── global.css           # Global styles
```

## Related Documentation

- [Root README](../../README.md) - Project overview and monorepo structure
- [Agent ADK](../galvanized-pukeko-agent-adk/README.md) - Server-side agent documentation
