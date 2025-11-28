export interface UiConfig {
    baseUrl: string
    wsUrl: string
    appName: string
}

class ConfigService {
    private config: UiConfig | null = null

    async load(): Promise<void> {
        try {
            const response = await fetch('/config')
            if (!response.ok) {
                throw new Error(`Failed to load configuration: ${response.statusText}`)
            }
            this.config = await response.json()
            console.log('[ConfigService] Configuration loaded:', this.config)
        } catch (error) {
            console.error('[ConfigService] Error loading configuration:', error)
            // Fallback to defaults if config fails to load (e.g. during development if backend not running)
            this.config = {
                baseUrl: 'http://localhost:8080',
                wsUrl: 'ws://localhost:8080/ws',
                appName: 'pukeko-ui-agent'
            }
            console.warn('[ConfigService] Using default configuration due to load error')
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
