# Wrap webservices

We need to isolate webservices so that the App.vue does not know about details of WS implementation.

- Move WS to connectionService.ts
- connection service should expose function to subscribe to certain messages
- Leave other functionality unchanged