import '@galvanized-pukeko-ai-ui/web-lib/style.css'

import { createApp } from 'vue'
import App from './App.vue'

import { configService } from '@galvanized-pukeko-ai-ui/web-lib'

async function init() {
    await configService.load()
    createApp(App).mount('#app')
}

init()
