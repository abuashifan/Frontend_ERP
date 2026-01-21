<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import VirtualTabsBar from '../components/VirtualTabsBar.vue'
import VirtualSubTabsBar from '../components/VirtualSubTabsBar.vue'
import VirtualTabsHost from '../components/VirtualTabsHost.vue'
import { useAuthStore } from '../stores/auth'
import { useTabsStore } from '../stores/tabs'
import { AUTH_ENABLED } from '../config/auth'

type MenuItem = {
  id: string
  title: string
  closable?: boolean
  defaultChild: {
    localId: string
    title: string
    component: string
    props?: Record<string, unknown>
    closable?: boolean
  }
}

const tabsStore = useTabsStore()
const authStore = useAuthStore()
const router = useRouter()
const authEnabled = AUTH_ENABLED

const menuItems = computed<MenuItem[]>(() => [
  {
    id: 'dashboard',
    title: 'Dashboard',
    closable: false,
    defaultChild: {
      localId: 'home',
      title: 'Dashboard',
      component: 'DashboardWorkspace',
      closable: false,
    },
  },
  {
    id: 'sales-invoices',
    title: 'Sales Invoices',
    defaultChild: {
      localId: 'list',
      title: 'Sales Invoices',
      component: 'SalesInvoiceListWorkspace',
      closable: false,
    },
  },
])

function openMenu(item: MenuItem) {
  const result = tabsStore.openModule({
    id: item.id,
    title: item.title,
    closable: item.closable,
    defaultChild: {
      localId: item.defaultChild.localId,
      title: item.defaultChild.title,
      component: item.defaultChild.component,
      props: item.defaultChild.props ?? {},
      closable: item.defaultChild.closable,
    },
  })

  if (!result.ok) {
    ElMessage.warning(result.message)
  }
}

if (tabsStore.modules.length === 0) {
  const first = menuItems.value[0]
  if (first) openMenu(first)
}

function logout() {
  authStore.clear()
  router.replace('/login')
}
</script>

<template>
  <el-container class="h-screen">
    <el-aside
      width="240px"
      class="border-r border-[var(--el-border-color-light)] bg-[var(--el-bg-color)]"
    >
      <div
        class="h-14 flex items-center px-4 font-bold border-b border-[var(--el-border-color-light)]"
      >
        ERP
      </div>
      <el-menu :default-active="tabsStore.activeModuleId ?? undefined">
        <el-menu-item
          v-for="item in menuItems"
          :key="item.id"
          :index="item.id"
          @click="openMenu(item)"
        >
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header
        class="h-14 flex items-center justify-between px-3 border-b border-[var(--el-border-color-light)]"
      >
        <div>Backend: Laravel API</div>
        <div class="flex items-center gap-2">
          <el-button v-if="authEnabled" size="small" @click="logout">Logout</el-button>
        </div>
      </el-header>

      <VirtualTabsBar />

      <VirtualSubTabsBar />

      <el-main class="min-h-0 !p-0">
        <VirtualTabsHost />
      </el-main>
    </el-container>
  </el-container>
</template>
