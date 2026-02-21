<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import {
  deleteChartOfAccount,
  listChartOfAccountsWithBalances,
  type ChartOfAccountWithBalance,
} from '../lib/api/modules/chartOfAccounts'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<ChartOfAccountWithBalance[]>([])

function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return '0.00'
  const num = typeof value === 'number' ? value : Number(String(value))
  if (!Number.isFinite(num)) return '0.00'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listChartOfAccountsWithBalances({ postableOnly: false, activeOnly: false })
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat chart of accounts'
    errorMessage.value = String(message ?? 'Gagal memuat chart of accounts')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Account',
    component: 'ChartOfAccountFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: ChartOfAccountWithBalance) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit ${row.code}`,
    component: 'ChartOfAccountFormWorkspace',
    props: { mode: 'edit', accountId: row.id },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

async function remove(row: ChartOfAccountWithBalance) {
  try {
    await ElMessageBox.confirm(
      `Hapus account ${row.code} — ${row.name}?`,
      'Confirm',
      { type: 'warning', confirmButtonText: 'Delete', cancelButtonText: 'Cancel' },
    )
  } catch {
    return
  }

  loading.value = true
  try {
    await deleteChartOfAccount(row.id)
    ElMessage.success('Account deleted')
    await load()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menghapus account'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">Chart of Accounts</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">Data diambil dari backend.</div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" type="primary" @click="openNew">New</el-button>
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
      </div>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table v-loading="loading" :data="rows" height="calc(100vh - 240px)" class="w-full" @row-dblclick="openEdit">
      <el-table-column prop="code" label="Code" width="160" />
      <el-table-column prop="name" label="Name" min-width="260" />
      <el-table-column prop="total_debit" label="Debit" width="160" align="right">
        <template #default="scope">
          {{ formatMoney(scope.row.total_debit) }}
        </template>
      </el-table-column>
      <el-table-column prop="total_credit" label="Credit" width="160" align="right">
        <template #default="scope">
          {{ formatMoney(scope.row.total_credit) }}
        </template>
      </el-table-column>
      <el-table-column prop="is_postable" label="Postable" width="120" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.is_postable ? 'success' : 'info'">
            {{ scope.row.is_postable ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_active" label="Active" width="120" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'">
            {{ scope.row.is_active ? 'Yes' : 'No' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="" width="180" align="center">
        <template #default="scope">
          <div class="flex items-center justify-center gap-2">
            <el-button size="small" @click="openEdit(scope.row)">Edit</el-button>
            <el-button size="small" type="danger" plain @click="remove(scope.row)">Delete</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && !errorMessage && rows.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      Tidak ada data.
    </div>
  </div>
</template>
