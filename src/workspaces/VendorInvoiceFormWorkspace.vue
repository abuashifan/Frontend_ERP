<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listVendors, type Vendor } from '../lib/api/modules/vendors'
import { listProducts, type Product } from '../lib/api/modules/products'
import {
  createVendorInvoice,
  getVendorInvoice,
  updateVendorInvoice,
  type CreateVendorInvoicePayload,
  type VendorInvoice,
  type VendorInvoiceLine,
} from '../lib/api/modules/vendorInvoices'
import { listPurchaseOrders, type PurchaseOrder } from '../lib/api/modules/purchaseOrders'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; vendorInvoiceId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const autoPostOnCreate = ref(true)

const vendors = ref<Vendor[]>([])
const products = ref<Product[]>([])
const purchaseOrders = ref<PurchaseOrder[]>([])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyModel(): CreateVendorInvoicePayload {
  return {
    vendor_id: 0,
    purchase_order_id: null,
    invoice_number: '',
    invoice_date: today(),
    due_date: today(),
    currency_code: 'IDR',
    exchange_rate: 1,
    tax_amount: 0,
    source_type: null,
    source_id: null,
    notes: null,
    lines: [
      {
        product_id: null,
        description: '',
        qty: 1,
        unit_price: 0,
        tax_id: null,
      },
    ],
  }
}

const model = ref<CreateVendorInvoicePayload>(createEmptyModel())

const lineSubtotal = computed(() => {
  return model.value.lines.reduce((sum, line) => {
    const qty = Number(line.qty ?? 0)
    const unitPrice = Number(line.unit_price ?? 0)
    const lineTotal = isFinite(qty) && isFinite(unitPrice) ? qty * unitPrice : 0
    return sum + lineTotal
  }, 0)
})

const grandTotal = computed(() => {
  const tax = Number(model.value.tax_amount ?? 0)
  return lineSubtotal.value + (isFinite(tax) ? tax : 0)
})

watch(
  model,
  () => {
    markDirty()
  },
  { deep: true },
)

function addLine() {
  model.value.lines.push({
    product_id: null,
    description: '',
    qty: 1,
    unit_price: 0,
    tax_id: null,
  })
}

function removeLine(index: number) {
  if (model.value.lines.length <= 1) return
  model.value.lines.splice(index, 1)
}

async function load() {
  loading.value = true

  try {
    ;[vendors.value, products.value, purchaseOrders.value] = await Promise.all([
      listVendors(),
      listProducts(),
      listPurchaseOrders(),
    ])

    if (isEdit.value) {
      if (!props.vendorInvoiceId) {
        ElMessage.error('vendorInvoiceId tidak ditemukan')
        return
      }

      const invoice: VendorInvoice = await getVendorInvoice(props.vendorInvoiceId)
      model.value = {
        vendor_id: invoice.vendor_id,
        purchase_order_id: invoice.purchase_order_id ?? null,
        invoice_number: invoice.invoice_number,
        invoice_date: String(invoice.invoice_date).slice(0, 10),
        due_date: String(invoice.due_date).slice(0, 10),
        currency_code: invoice.currency_code,
        exchange_rate: invoice.exchange_rate,
        tax_amount: invoice.tax_amount,
        source_type: invoice.source_type ?? null,
        source_id: invoice.source_id ?? null,
        notes: invoice.notes ?? null,
        lines: (invoice.lines ?? []).map((l): VendorInvoiceLine => ({
          id: l.id,
          product_id: l.product_id ?? null,
          description: l.description ?? '',
          qty: l.qty ?? 0,
          unit_price: l.unit_price ?? 0,
          tax_id: l.tax_id ?? null,
        })),
      }

      if (!model.value.lines.length) model.value.lines = createEmptyModel().lines
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat vendor invoice'))
  } finally {
    loading.value = false
  }
}

function resetForCreateOnClose() {
  loaded.value = false
  saving.value = false
  loading.value = false
  model.value = createEmptyModel()
  clearDirty()
}

async function save() {
  saving.value = true
  try {
    if (!model.value.vendor_id || model.value.vendor_id <= 0) {
      ElMessage.warning('Vendor wajib diisi')
      return
    }

    if (!model.value.invoice_number) {
      ElMessage.warning('Invoice number wajib diisi')
      return
    }

    if (!model.value.invoice_date) {
      ElMessage.warning('Invoice date wajib diisi')
      return
    }

    if (!model.value.due_date) {
      ElMessage.warning('Due date wajib diisi')
      return
    }

    if (!model.value.currency_code) {
      ElMessage.warning('Currency code wajib diisi')
      return
    }

    if (!model.value.lines?.length) {
      ElMessage.warning('Lines wajib diisi')
      return
    }

    for (const [idx, line] of model.value.lines.entries()) {
      if (!line.description) {
        ElMessage.warning(`Line ${idx + 1}: description wajib diisi`)
        return
      }
    }

    if (isEdit.value) {
      if (!props.vendorInvoiceId) {
        ElMessage.error('vendorInvoiceId tidak ditemukan')
        return
      }
      await updateVendorInvoice(props.vendorInvoiceId, model.value)
    } else {
      await createVendorInvoice(model.value, autoPostOnCreate.value)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan vendor invoice'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})

onActivated(() => {
  if (!loaded.value && !loading.value) void load()
})

onDeactivated(() => {
  const stillOpen = tabsStore.getChildTab(props.tabId) !== null
  if (!stillOpen && props.mode === 'create') {
    resetForCreateOnClose()
  }
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Vendor Invoice' : 'New Vendor Invoice' }}</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="!isEdit" class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Auto post</span>
          <el-switch v-model="autoPostOnCreate" />
        </div>
        <el-button type="primary" :loading="saving" @click="save">Save</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-width="140px" class="max-w-[920px]">
      <el-form-item label="Vendor">
        <el-select v-model="model.vendor_id" filterable class="w-full">
          <el-option v-for="v in vendors" :key="v.id" :label="`${v.code} — ${v.name}`" :value="v.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Purchase Order">
        <el-select v-model="model.purchase_order_id" filterable clearable class="w-full">
          <el-option
            v-for="po in purchaseOrders"
            :key="po.id"
            :label="`${po.po_number} (Vendor #${po.vendor_id})`"
            :value="po.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Invoice Number">
        <el-input v-model="model.invoice_number" />
      </el-form-item>

      <el-form-item label="Invoice Date">
        <el-date-picker v-model="model.invoice_date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="Due Date">
        <el-date-picker v-model="model.due_date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="Currency Code">
        <el-input v-model="model.currency_code" maxlength="3" />
      </el-form-item>

      <el-form-item label="Exchange Rate">
        <el-input v-model="model.exchange_rate" />
      </el-form-item>

      <el-form-item label="Tax Amount">
        <el-input v-model="model.tax_amount" />
      </el-form-item>

      <el-form-item label="Notes">
        <el-input v-model="model.notes" type="textarea" />
      </el-form-item>

      <div class="mt-6 mb-2 flex items-center justify-between">
        <div class="text-base font-semibold">Lines</div>
        <el-button size="small" @click="addLine">Add line</el-button>
      </div>

      <el-table :data="model.lines" class="w-full" border>
        <el-table-column label="#" width="60">
          <template #default="scope">
            <div class="text-center">{{ scope.$index + 1 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Product" min-width="220">
          <template #default="scope">
            <el-select v-model="scope.row.product_id" filterable clearable class="w-full">
              <el-option v-for="p in products" :key="p.id" :label="`${p.code} — ${p.name}`" :value="p.id" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Description" min-width="260">
          <template #default="scope">
            <el-input v-model="scope.row.description" />
          </template>
        </el-table-column>

        <el-table-column label="Qty" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.qty" />
          </template>
        </el-table-column>

        <el-table-column label="Unit Price" width="140">
          <template #default="scope">
            <el-input v-model="scope.row.unit_price" />
          </template>
        </el-table-column>

        <el-table-column label="" width="90" align="center">
          <template #default="scope">
            <el-button size="small" type="danger" plain @click="removeLine(scope.$index)">Remove</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
        Subtotal: {{ lineSubtotal.toFixed(2) }} | Total: {{ grandTotal.toFixed(2) }}
      </div>
    </el-form>
  </div>
</template>
