# Websockets server

In server/src/js/random-server.ts create WebSockets server
which will communicate with src/App.vue.

Server should send a message every 10 seconds requesting App to render
a form with 3 random components from src/components, the server decides which components to render,
the Vue app should obey and render them into wrapper.

The message server should be minimal sending:
- component name without a prefix
- label if applicable