# Configuration

The library is configured at runtime through `configService`. Call `configService.load()` once
before mounting, then `configService.get()` returns the resolved config.

```ts
import { configService } from '@galvanized-pukeko/vue-ui'

await configService.load()
const cfg = configService.get()
```

## `UiConfig`

```ts
interface UiConfig {
  agUiUrl: string        // AG-UI run endpoint, e.g. http://host:3000/agents/default/run
  appName?: string
  pageTitle?: string
  configUrl?: string     // optional: load the real config from this URL instead
  logo?:   { text?: string; href?: string; img?: string }
  header?: { text?: string; href?: string; img?: string }[]
  footer?: { text?: string; href?: string; img?: string }[]
}
```

## How `load()` resolves config

1. **Build-time URL.** If the app was built with the `__AGUI_URL__` define set (Vite consumers can
   inject `process.env.AGUI_URL`), that value is used directly and `load()` returns immediately.
   This is the convenient path for a dev server pointed at a known agent.
2. **`/config.json` at runtime.** Otherwise `load()` fetches `/config.json` from the serving origin.
   This is the path a prebuilt/published app uses — the server (or a static `public/config.json`)
   supplies the endpoint.
3. **Indirection via `configUrl`.** If the fetched config contains `configUrl`, the real config is
   fetched from there. Useful when the page is served separately from the agent.
4. **`baseUrl` fallback.** For backward compatibility, if a config has `baseUrl` but no `agUiUrl`,
   the endpoint is derived as `` `${baseUrl}/agents/default/run` `` (the AG-UI standard path).

## Examples

Static SPA pointed at a local Gaunt Sloth server:

```json
{ "agUiUrl": "http://localhost:3000/agents/default/run", "appName": "Gaunt Sloth" }
```

Page that defers to the agent's own config endpoint:

```json
{ "configUrl": "http://localhost:8080/config.json" }
```
