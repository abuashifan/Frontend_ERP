import { createRouter, createWebHistory } from 'vue-router'

import ErpShell from '../layouts/ErpShell.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/app' },
    {
      path: '/app',
      name: 'app',
      component: ErpShell,
    },
  ],
})
