import { createRouter, createWebHistory } from 'vue-router'

import ErpShell from '../layouts/ErpShell.vue'
import LoginView from '../views/LoginView.vue'

import { useAuthStore } from '../stores/auth'
import { AUTH_ENABLED } from '../config/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/app' },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/app',
      name: 'app',
      component: ErpShell,
    },
  ],
})

router.beforeEach((to) => {
  if (!AUTH_ENABLED) {
    if (to.path === '/login') return { path: '/app' }
    return
  }

  const authStore = useAuthStore()
  const isPublic = Boolean(to.meta.public)

  if (!isPublic && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return { path: '/app' }
  }
})
