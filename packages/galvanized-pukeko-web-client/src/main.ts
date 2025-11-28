import './assets/global.css'

import { createApp } from 'vue'
import App from './App.vue'

import { configService } from './services/configService'

async function init() {
    await configService.load()
    createApp(App).mount('#app')
}

init()
