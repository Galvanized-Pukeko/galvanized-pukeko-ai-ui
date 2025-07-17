# Galvanized Pukeko

Galvanized Pukeko UI is a framework that allows LLM models (AI) to flexibly render forms and components when
getting information from users. It eliminates the need to render entire HTML pages while maintaining consistent
formatting and coherent branded interfaces.

![galvanized-pukeko-logo.png](assets/galvanized-pukeko-logo.png)

The project is at a very early prototyping stage, so it is not very helpful yet.

```mermaid
graph LR
    AI((_ LLM _))

    subgraph S[Galvanized Pukeko Server]
        direction TB
        PMCP[Galvanized Pukeko MCP Server] <--> PWS[Galvanized Pukeko Websockets Server]
    end

    subgraph BL[Business Logic]
        direction TB
        MCP1
        MCP2
        MCPn
    end

    subgraph Browser
        CL["Galvanized Pukeko Web Client (Vue)"]
    end
    
    AICL[AI Client]

    AI --> BL
    AI --> PMCP
    PMCP --> AICL
    PWS <--> | websockets | CL
    BL --> AICL
    AICL --> AI
    AICL <--> PWS
    
```

# Running a quick demo

## HTTP and provided demo server
```bash
git clone https://github.com/Galvanized-Pukeko/galvanized-pukeko-ai-ui.git
cd galvanized-pukeko-ai-ui
npm install
npm run 
```

Http UI MCP
```bash
npm run ui-mcp-server
```

Web (just to serve the Web)
```bash
npm run web
```

Start mock data MCP
```bash
npm run demo-data-mcp-server
```

Start a chat client in the terminal (http)
```bash
npm run chat
```

Chat is preconfigured with `vertexai`, so you need to authenticate.

Config is in `packages/ui-mcp-server-js/.gsloth.config.mjs`, so different AI provider can be chosen.

---

When everything is up:

Ask chat to `list reports`

Then ask to `render bar chart of performance`

## STDIO

Note, your client starts the STDIO server.

Start the Web renderer (web server):
```bash
npm install
npm run build-ui-server
```

Install UI server to your local NPM cache
```bash
npm install ./packages/ui-mcp-server-js/ -g
```
(open the provided link in the browser)

```bash
npm run web
```

Configure your client:
```json
{
  "mcpServers": {
    "pukeko": {
      "command": "galvanized-pukeko-ui-mcp-stdio",
      "args": [
        ""
      ]
    }
  }
}
```

On Windows you might need to specify a file extension
```json
{
  "mcpServers": {
    "pukeko": {
      "command": "galvanized-pukeko-ui-mcp-stdio.bin",
      "args": [
        ""
      ]
    }
  }
}
```


## Development

Kitchen Sink is a static collection of all components (for component inspection)
```bash
npm run sink
```

## Contributing

Contributions are welcome. Feel free to create an issue to contact us.
