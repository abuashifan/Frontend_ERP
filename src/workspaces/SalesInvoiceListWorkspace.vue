<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listSalesInvoices, type SalesInvoice } from '../lib/api/modules/salesInvoices'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<SalesInvoice[]>([])

function hasSerialCaptured(row: SalesInvoice): boolean {
  return Boolean(row.serial_captured) || Number(row.serial_captured_count ?? 0) > 0
}

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listSalesInvoices()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat sales invoices'
    errorMessage.value = String(message ?? 'Gagal memuat sales invoices')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const existing = tabsStore.getChildTab('sales-invoices::new')
  if (existing) {
    tabsStore.activateChildTab(existing.id)
    return
  }

  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Sales Invoice',
    component: 'SalesInvoiceFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: SalesInvoice) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit Sales Invoice ${row.invoice_number}`,
    component: 'SalesInvoiceFormWorkspace',
    props: { mode: 'edit', invoiceId: row.id },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">Sales Invoices</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">Data diambil dari backend.</div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" type="primary" @click="openNew">New</el-button>
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
      </div>
    </div>

    <el-alert
      v-if="errorMessage"
      type="error"
      :title="errorMessage"
      show-icon
      class="mb-3"
    />

    <el-table
      v-loading="loading"
      :data="rows"
      height="calc(100vh - 240px)"
      class="w-full"
      @row-dblclick="openEdit"
    >
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="invoice_number" label="Invoice #" width="160" />
      <el-table-column prop="invoice_date" label="Invoice Date" width="140" />
      <el-table-column prop="due_date" label="Due Date" width="140" />
      <el-table-column prop="customer_id" label="Customer" width="120" />
      <el-table-column prop="status" label="Status" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'draft' ? 'info' : 'success'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Serial" width="150">
        <template #default="scope">
          <el-tag v-if="hasSerialCaptured(scope.row)" type="warning">Serial captured</el-tag>
          <span v-else class="text-xs text-[var(--el-text-color-secondary)]">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="currency_code" label="CCY" width="90" />
      <el-table-column prop="total_amount" label="Total" min-width="140" />
    </el-table>

    <div
      v-if="!loading && !errorMessage && rows.length === 0"
      class="mt-3 text-sm text-[var(--el-text-color-secondary)]"
    >
      Tidak ada data.
    </div>
  </div>
</template>
