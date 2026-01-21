<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import VirtualTabsBar from '../components/VirtualTabsBar.vue'
import VirtualTabsHost from '../components/VirtualTabsHost.vue'
import { useAuthStore } from '../stores/auth'
import { useTabsStore } from '../stores/tabs'

type MenuItem = {
  id: string
  title: string
  component: string
  props?: Record<string, unknown>
  closable?: boolean
}

const tabsStore = useTabsStore()
const authStore = useAuthStore()
const router = useRouter()

const menuItems = computed<MenuItem[]>(() => [
  {
    id: 'dashboard',
    title: 'Dashboard',
    component: 'DashboardWorkspace',
    closable: false,
  },
  {
    id: 'sales-invoices',
    title: 'Sales Invoices',
    component: 'SalesInvoiceListWorkspace',
  },
])

function openMenu(item: MenuItem) {
  const result = tabsStore.openTab({
    id: item.id,
    title: item.title,
    component: item.component,
    props: item.props ?? {},
    closable: item.closable,
  })

  if (!result.ok) {
    ElMessage.warning(result.message)
  }
}

if (tabsStore.tabs.length === 0) {
  const first = menuItems.value[0]
  if (first) openMenu(first)
}

function logout() {
  authStore.clear()
  router.replace('/login')
}
</script>

<template>
  <el-container class="shell">
    <el-aside width="240px" class="aside">
      <div class="brand">ERP</div>
      <el-menu class="menu" :default-active="tabsStore.activeTabId ?? undefined">
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

    <el-container class="main">
      <el-header class="header">
        <div class="header-left">Backend: Laravel API</div>
        <div class="header-right">
          <el-button size="small" @click="logout">Logout</el-button>
        </div>
      </el-header>

      <VirtualTabsBar />

      <el-main class="content">
        <VirtualTabsHost />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.shell {
  height: 100vh;
}

.aside {
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.brand {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 700;
  border-bottom: 1px solid var(--el-border-color-light);
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  justify-content: space-between;
  padding: 0 12px;
}

.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.content {
  padding: 0;
  min-height: 0;
}
</style>
