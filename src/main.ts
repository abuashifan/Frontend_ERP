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
import { DEFAULT_COMPANY_ID } from './config/tenant'

const app = createApp(App)
app.use(pinia)

// Bootstrap persisted auth token early.
useAuthStore().loadFromStorage()
useTenantStore().loadFromStorage()

// Single-company default: allow configuring company once via env.
const tenantStore = useTenantStore()
if (!tenantStore.activeCompanyId && DEFAULT_COMPANY_ID) {
	tenantStore.setActiveCompanyId(DEFAULT_COMPANY_ID)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')

if (AUTH_ENABLED) {
	window.addEventListener(AUTH_UNAUTHORIZED_EVENT, () => {
		router.replace('/login')
	})
}
