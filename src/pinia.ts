import { createPinia, setActivePinia } from 'pinia'

export const pinia = createPinia()

// Allows using stores from non-component modules (e.g., axios interceptors).
setActivePinia(pinia)
