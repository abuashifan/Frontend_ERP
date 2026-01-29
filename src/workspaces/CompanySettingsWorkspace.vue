<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { ensureAccountingPeriods, getBootstrap } from '../lib/api/modules/system'
import { useTenantStore } from '../stores/tenant'

const tenantStore = useTenantStore()

const loading = ref(false)
const bootstrapLoading = ref(false)

const setupRequired = ref(false)
const companiesCount = ref(0)
const singleCompanyId = ref<number | null>(null)
const company = ref<null | {
  id: number
  code: string
  name: string
  base_currency: string
  fiscal_year_start_month: number
  fiscal_year_start_year: number
  timezone: string
  is_active: boolean
}>(null)

const desiredCompanyId = computed(() => {
  if (singleCompanyId.value) return String(singleCompanyId.value)
  if (company.value?.id) return String(company.value.id)
  return null
})

async function refreshBootstrap() {
  bootstrapLoading.value = true
  try {
    const res = await getBootstrap()
    setupRequired.value = res.data.setupRequired
    companiesCount.value = res.data.companiesCount
    singleCompanyId.value = res.data.singleCompanyId
    company.value = res.data.company
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal memuat bootstrap'))
  } finally {
    bootstrapLoading.value = false
  }
}

function syncTenantCompanyId() {
  const next = desiredCompanyId.value
  if (!next) {
    ElMessage.warning('Tidak ada company untuk diset')
    return
  }

  tenantStore.setActiveCompanyId(next)
  ElMessage.success(`Company context diset ke ${next}`)
}

async function ensurePeriods() {
  loading.value = true
  try {
    const res = await ensureAccountingPeriods(1, 1)
    ElMessage.success(`Accounting periods ensured. Inserted=${res.data.inserted}, skipped=${res.data.skipped_existing}`)
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal generate accounting periods'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refreshBootstrap()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <div class="text-lg font-semibold">Company Settings</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          Untuk memastikan company context + accounting period siap untuk transaksi.
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :loading="bootstrapLoading" @click="refreshBootstrap">Refresh</el-button>
        <el-button type="primary" :disabled="!desiredCompanyId" @click="syncTenantCompanyId">
          Sync Company Context
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="setupRequired"
      type="warning"
      show-icon
      title="Company setup belum dilakukan"
      description="Silakan buka /setup/company (butuh login) untuk membuat company pertama."
      class="mb-3"
    />

    <el-card class="mb-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">companiesCount</div>
          <div class="font-mono">{{ companiesCount }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">singleCompanyId</div>
          <div class="font-mono">{{ singleCompanyId ?? '-' }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">activeCompanyId (frontend)</div>
          <div class="font-mono">{{ tenantStore.activeCompanyId ?? '-' }}</div>
        </div>
      </div>
    </el-card>

    <el-card v-if="company" class="mb-3">
      <template #header>
        <div class="font-semibold">Company</div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">id</div>
          <div class="font-mono">{{ company.id }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">code</div>
          <div class="font-mono">{{ company.code }}</div>
        </div>
        <div class="md:col-span-2">
          <div class="text-xs text-[var(--el-text-color-secondary)]">name</div>
          <div>{{ company.name }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">base_currency</div>
          <div class="font-mono">{{ company.base_currency }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">timezone</div>
          <div class="font-mono">{{ company.timezone }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">fiscal_year_start_month</div>
          <div class="font-mono">{{ company.fiscal_year_start_month }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">fiscal_year_start_year</div>
          <div class="font-mono">{{ company.fiscal_year_start_year }}</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="font-semibold">Maintenance</div>
      </template>

      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="font-medium">Ensure accounting periods</div>
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            Membuat periode akuntansi untuk tahun lalu, tahun ini, dan tahun depan (tidak mengubah periode yang sudah ada).
          </div>
        </div>
        <el-button type="primary" :loading="loading" @click="ensurePeriods">Ensure Periods</el-button>
      </div>
    </el-card>
  </div>
</template>
