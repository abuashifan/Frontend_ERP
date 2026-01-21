<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const tabsStore = useTabsStore()

const demoInvoices = ['INV-001', 'INV-002', 'INV-003']

function openInvoice(invoiceId: string) {
  const result = tabsStore.openTab({
    id: `sales-invoice-${invoiceId}`,
    title: `Sales Invoice ${invoiceId}`,
    component: 'SalesInvoiceFormWorkspace',
    props: { invoiceId },
  })

  if (!result.ok) {
    ElMessage.warning(result.message)
  }
}
</script>

<template>
  <div class="p-4">
    <h2>Sales Invoices</h2>
    <p>Contoh list. Klik untuk membuka instance tab baru (unik per ID).</p>

    <el-space direction="vertical" alignment="start">
      <el-button v-for="id in demoInvoices" :key="id" @click="openInvoice(id)">
        Buka {{ id }}
      </el-button>
    </el-space>
  </div>
</template>
