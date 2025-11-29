interface UiConfigItem {
  text?: string
  href?: string
  img?: string
}

export interface UiConfig {
  baseUrl: string
  wsUrl: string
  appName: string
  pageTitle?: string
  configUrl?: string
  logo?: UiConfigItem
  header?: UiConfigItem[]
  footer?: UiConfigItem[]
}

class ConfigService {
  private config: UiConfig | null = null

  async load(): Promise<void> {
    try {
      const response = await fetch('/config.json')
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const config = await response.json()
      if (config.configUrl) {
        const fallbackConfig = await fetch(config.configUrl);
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        this.config = await fallbackConfig.json() as UiConfig;
        console.log('[ConfigService] Fallback configuration loaded:', this.config)
      } else {
        this.config = config as UiConfig
        console.log('[ConfigService] Configuration loaded:', this.config)
      }
    } catch (error) {
      throw new Error(`Failed to load configuration:${error.message || error}`);
    }
  }

  get(): UiConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() before accessing config.')
    }
    return this.config
  }
}

export const configService = new ConfigService()
