import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { pinia } from './pinia'
import { router } from './router'

import './style.css'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import { useTenantStore } from './stores/tenant'
import { AUTH_UNAUTHORIZED_EVENT } from './lib/events'
import { AUTH_ENABLED } from './config/auth'

const app = createApp(App)
app.use(pinia)

// Bootstrap persisted auth token early.
useAuthStore().loadFromStorage()
useTenantStore().loadFromStorage()

app.use(router)
app.use(ElementPlus)
app.mount('#app')

if (AUTH_ENABLED) {
	window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
		router.replace('/login')
	})
}
