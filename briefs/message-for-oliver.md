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

Start chat client in terminal (http)
```bash
npm run chat
```

Config is in `packages/ui-mcp-server-js/.gsloth.config.mjs`

There's also STDIO for the UI server
```bash
npm run ui-mcp-server-stdio
```

Which needs to be configured, but I did not test it, so it's likely not working.
