import '@galvanized-pukeko/vue-ui/style.css'

import { createApp } from 'vue'
import App from './App.vue'

import { configService } from '@galvanized-pukeko/vue-ui'

async function init() {
    await configService.load()
    createApp(App).mount('#app')
}

init()
