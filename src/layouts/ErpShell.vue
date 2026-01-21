<script setup lang="ts">
import { computed, onMounted, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import VirtualTabsBar from '../components/VirtualTabsBar.vue'
import VirtualSubTabsBar from '../components/VirtualSubTabsBar.vue'
import VirtualTabsHost from '../components/VirtualTabsHost.vue'
import TenantSwitcher from '../components/TenantSwitcher.vue'
import { useAuthStore } from '../stores/auth'
import { useTabsStore } from '../stores/tabs'
import { AUTH_ENABLED } from '../config/auth'
import { TENANT_SWITCHER_ENABLED } from '../config/tenant'
import { useTenantStore } from '../stores/tenant'
import { MENU_ITEMS, type MenuItemConfig } from '../config/menu'
import { getBootstrap } from '../lib/api/modules/system'

const tabsStore = useTabsStore()
const authStore = useAuthStore()
const tenantStore = useTenantStore()
const router = useRouter()
const authEnabled = AUTH_ENABLED
const tenantSwitcherEnabled = TENANT_SWITCHER_ENABLED

const menuItems = computed<MenuItemConfig[]>(() => MENU_ITEMS)

function openMenu(item: MenuItemConfig) {
  const result = tabsStore.openModule({
    id: item.id,
    title: item.title,
    closable: item.closable,
    showSubTabsBar: item.showSubTabsBar,
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

watchEffect(() => {
  if (tabsStore.modules.length !== 0) return
  const first = menuItems.value[0]
  if (first) openMenu(first)
})

function logout() {
  authStore.clear()
  router.replace('/login')
}

onMounted(async () => {
  try {
    const bootstrap = await getBootstrap()

    // Single-company mode: keep the frontend tenant id in sync with backend.
    // This prevents stale localStorage company ids after `migrate:fresh --seed`.
    if (!tenantSwitcherEnabled && bootstrap.data.singleCompanyId) {
      const desired = String(bootstrap.data.singleCompanyId)
      if (tenantStore.activeCompanyId !== desired) {
        tenantStore.setActiveCompanyId(desired)
      }
    }

    if (bootstrap.data.setupRequired) {
      router.replace('/setup/company')
    }
  } catch (e) {
    // If auth is disabled in the frontend but backend still requires a token,
    // this request may fail. Keep UX graceful.
    console.error(e)
  }
})
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
          <TenantSwitcher v-if="tenantSwitcherEnabled" />
          <el-tag v-else-if="tenantStore.activeCompanyId" size="small" type="info">
            Company: {{ tenantStore.activeCompanyId }}
          </el-tag>
          <el-tag v-else size="small" type="warning">No company</el-tag>
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
