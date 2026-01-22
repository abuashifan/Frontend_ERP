<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listCustomers, type Customer } from '../lib/api/modules/customers'
import { listSalesInvoices, type SalesInvoice } from '../lib/api/modules/salesInvoices'
import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import { listProducts, type Product } from '../lib/api/modules/products'
import {
  createSalesReturn,
  getSalesReturn,
  type CreateSalesReturnPayload,
  type SalesReturn,
  type SalesReturnLine,
} from '../lib/api/modules/salesReturns'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'view'; salesReturnId?: number }>()

const isCreate = computed(() => props.mode === 'create')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const customers = ref<Customer[]>([])
const salesInvoices = ref<SalesInvoice[]>([])
const warehouses = ref<Warehouse[]>([])
const products = ref<Product[]>([])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyModel(): CreateSalesReturnPayload {
  return {
    customer_id: 0,
    sales_invoice_id: 0,
    warehouse_id: 0,
    reference: null,
    date: today(),
    currency_code: 'IDR',
    exchange_rate: 1,
    tax_amount: 0,
    lines: [
      {
        product_id: 0,
        quantity: 1,
        unit_price: 0,
      },
    ],
  }
}

const model = ref<CreateSalesReturnPayload>(createEmptyModel())

const filteredInvoices = computed(() => {
  if (!model.value.customer_id) return salesInvoices.value
  return salesInvoices.value.filter((inv) => inv.customer_id === model.value.customer_id)
})

const lineSubtotal = computed(() => {
  return model.value.lines.reduce((sum, line) => {
    const qty = Number(line.quantity ?? 0)
    const unitPrice = Number(line.unit_price ?? 0)
    const total = isFinite(qty) && isFinite(unitPrice) ? qty * unitPrice : 0
    return sum + (isFinite(total) ? total : 0)
  }, 0)
})

const grandTotal = computed(() => {
  const tax = Number(model.value.tax_amount ?? 0)
  return lineSubtotal.value + (isFinite(tax) ? tax : 0)
})

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    if (!isCreate.value) return
    markDirty()
  },
  { deep: true },
)

function addLine() {
  model.value.lines.push({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
  })
}

function removeLine(index: number) {
  if (model.value.lines.length <= 1) {
    ElMessage.warning('Minimal 1 line')
    return
  }
  model.value.lines.splice(index, 1)
}

async function load() {
  loading.value = true

  try {
    ;[customers.value, salesInvoices.value, warehouses.value, products.value] = await Promise.all([
      listCustomers(),
      listSalesInvoices(),
      listWarehouses(),
      listProducts(),
    ])

    if (!isCreate.value) {
      if (!props.salesReturnId) {
        ElMessage.error('salesReturnId tidak ditemukan')
        return
      }

      const sr: SalesReturn = await getSalesReturn(props.salesReturnId)
      model.value = {
        customer_id: sr.customer_id,
        sales_invoice_id: sr.sales_invoice_id,
        warehouse_id: sr.warehouse_id,
        reference: sr.reference ?? null,
        date: sr.date ? String(sr.date).slice(0, 10) : null,
        currency_code: sr.currency_code,
        exchange_rate: sr.exchange_rate,
        tax_amount: sr.tax_amount,
        lines: (sr.lines ?? []).map((l): SalesReturnLine => ({
          id: l.id,
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          total: l.total,
        })),
      }

      if (!model.value.lines.length) model.value.lines = createEmptyModel().lines
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat sales return'))
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
    if (!model.value.customer_id || model.value.customer_id <= 0) {
      ElMessage.warning('Customer wajib diisi')
      return
    }

    if (!model.value.sales_invoice_id || model.value.sales_invoice_id <= 0) {
      ElMessage.warning('Sales invoice wajib dipilih')
      return
    }

    if (!model.value.warehouse_id || model.value.warehouse_id <= 0) {
      ElMessage.warning('Warehouse wajib dipilih')
      return
    }

    if (!model.value.date) {
      ElMessage.warning('Date wajib diisi')
      return
    }

    if (!model.value.lines?.length) {
      ElMessage.warning('Minimal 1 line')
      return
    }

    for (const [idx, line] of model.value.lines.entries()) {
      if (!line.product_id || line.product_id <= 0) {
        ElMessage.warning(`Line ${idx + 1}: product wajib dipilih`)
        return
      }

      const qty = Number(line.quantity ?? 0)
      if (!isFinite(qty) || qty <= 0) {
        ElMessage.warning(`Line ${idx + 1}: quantity wajib > 0`)
        return
      }

      const price = Number(line.unit_price ?? 0)
      if (!isFinite(price) || price < 0) {
        ElMessage.warning(`Line ${idx + 1}: unit price wajib >= 0`)
        return
      }
    }

    await createSalesReturn(model.value)

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan sales return'))
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
        <div class="text-lg font-semibold">{{ isCreate ? 'New Sales Return' : 'Sales Return' }}</div>
        <el-tag v-if="isCreate" :type="dirty ? 'warning' : 'success'">{{ dirty ? 'Unsaved' : 'Saved' }}</el-tag>
      </div>
      <el-button v-if="isCreate" type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-width="160px" class="max-w-[980px]">
      <el-form-item label="Customer">
        <el-select v-model="model.customer_id" filterable class="w-full" :disabled="!isCreate">
          <el-option v-for="c in customers" :key="c.id" :label="`${c.code} — ${c.name}`" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sales Invoice">
        <el-select v-model="model.sales_invoice_id" filterable class="w-full" :disabled="!isCreate">
          <el-option
            v-for="inv in filteredInvoices"
            :key="inv.id"
            :label="`${inv.invoice_number} (Customer #${inv.customer_id})`"
            :value="inv.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Warehouse">
        <el-select v-model="model.warehouse_id" filterable class="w-full" :disabled="!isCreate">
          <el-option v-for="w in warehouses" :key="w.id" :label="`${w.code} — ${w.name}`" :value="w.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Reference">
        <el-input v-model="model.reference" :disabled="!isCreate" />
      </el-form-item>

      <el-form-item label="Date">
        <el-date-picker v-model="model.date" type="date" value-format="YYYY-MM-DD" :disabled="!isCreate" />
      </el-form-item>

      <el-form-item label="Currency Code">
        <el-input v-model="model.currency_code" maxlength="3" :disabled="!isCreate" />
      </el-form-item>

      <el-form-item label="Exchange Rate">
        <el-input v-model="model.exchange_rate" :disabled="!isCreate" />
      </el-form-item>

      <el-form-item label="Tax Amount">
        <el-input v-model="model.tax_amount" :disabled="!isCreate" />
      </el-form-item>

      <div class="mt-6 mb-2 flex items-center justify-between">
        <div class="text-base font-semibold">Lines</div>
        <el-button v-if="isCreate" size="small" @click="addLine">Add line</el-button>
      </div>

      <el-table :data="model.lines" class="w-full" border>
        <el-table-column label="#" width="60">
          <template #default="scope">
            <div class="text-center">{{ scope.$index + 1 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Product" min-width="280">
          <template #default="scope">
            <el-select v-model="scope.row.product_id" filterable class="w-full" :disabled="!isCreate">
              <el-option v-for="p in products" :key="p.id" :label="`${p.code} — ${p.name}`" :value="p.id" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Qty" width="140">
          <template #default="scope">
            <el-input v-model="scope.row.quantity" :disabled="!isCreate" />
          </template>
        </el-table-column>

        <el-table-column label="Unit Price" width="160">
          <template #default="scope">
            <el-input v-model="scope.row.unit_price" :disabled="!isCreate" />
          </template>
        </el-table-column>

        <el-table-column v-if="isCreate" label="" width="90" align="center">
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
