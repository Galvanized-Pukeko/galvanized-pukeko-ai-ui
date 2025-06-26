# Galvanized Pukeko

Galvanized Pukeko UI is a framework that allows LLM models (AI) to flexibly render forms and components when
getting information from users. It eliminates the need to render entire HTML pages while maintaining consistent
formatting and coherent branded interfaces.

![galvanized-pukeko-logo.png](assets/galvanized-pukeko-logo.png)

The project is at a very early prototyping stage, so it is not very helpful yet.

Running 
```bash
git clone https://github.com/andruhon/galvanized-pukeko-ai-ui.git
cd galvanized-pukeko-ai-ui
npm install
```

Start MCP and Websockets server
```bash
npm run server
```

Start Vue app in a separate console
```bash
npm run client
```

Server should be running on port 3002, now you can connect your client to this:
```json
{
      "transport": "http",
      "url": "http://localhost:3002/mcp"
}
```
(you can alternatively `server/src/js/mcp-stdio.ts`)

You can use [Gaunt Sloth](https://github.com/andruhon/gaunt-sloth-assistant) installation to connect to this MCP.
(it is currently preconfigured to use an Anthropic API key, but you can change `server/.gsloth.config.json` to use different provider)
```bash
npm run chat
```

In the chat ask it to render a form to collect user data.

## Development

Kitchen Sink is a static collection of all components (for component inspection)
```bash
npm run sink
```

## Contributing

Contributions are welcome. Feel free to create an issue to contact us.
