<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listVendorInvoices, type VendorInvoice } from '../lib/api/modules/vendorInvoices'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<VendorInvoice[]>([])

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    rows.value = await listVendorInvoices()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat vendor invoices'
    errorMessage.value = String(message ?? 'Gagal memuat vendor invoices')
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function openNew() {
  const existing = tabsStore.getChildTab('vendor-invoices::new')
  if (existing) {
    tabsStore.activateChildTab(existing.id)
    return
  }

  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Vendor Invoice',
    component: 'VendorInvoiceFormWorkspace',
    props: { mode: 'create' },
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}

function openEdit(row: VendorInvoice) {
  const result = tabsStore.openChildTab({
    localId: `edit-${row.id}`,
    title: `Edit Vendor Invoice ${row.invoice_number}`,
    component: 'VendorInvoiceFormWorkspace',
    props: { mode: 'edit', vendorInvoiceId: row.id },
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
        <div class="text-lg font-semibold">Vendor Invoices</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">Data diambil dari backend.</div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" type="primary" @click="openNew">New</el-button>
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
      </div>
    </div>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

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
      <el-table-column prop="vendor_id" label="Vendor" width="120" />
      <el-table-column prop="status" label="Status" width="120" />
      <el-table-column prop="currency_code" label="CCY" width="90" />
      <el-table-column prop="total_amount" label="Total" min-width="140" />
    </el-table>

    <div v-if="!loading && !errorMessage && rows.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      Tidak ada data.
    </div>
  </div>
</template>
