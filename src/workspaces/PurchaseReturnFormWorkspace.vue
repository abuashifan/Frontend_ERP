<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listVendors, type Vendor } from '../lib/api/modules/vendors'
import { listProducts, type Product } from '../lib/api/modules/products'
import { listVendorInvoices, type VendorInvoice } from '../lib/api/modules/vendorInvoices'
import {
  createPurchaseReturn,
  getPurchaseReturn,
  type CreatePurchaseReturnPayload,
  type PurchaseReturn,
  type PurchaseReturnLine,
} from '../lib/api/modules/purchaseReturns'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'view'; purchaseReturnId?: number }>()

const isCreate = computed(() => props.mode === 'create')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const autoPostOnCreate = ref(true)

const vendors = ref<Vendor[]>([])
const products = ref<Product[]>([])
const vendorInvoices = ref<VendorInvoice[]>([])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyModel(): CreatePurchaseReturnPayload {
  return {
    vendor_id: 0,
    purchase_invoice_id: null,
    reference: null,
    date: today(),
    total_amount: 0,
    lines: [
      {
        product_id: 0,
        quantity: 1,
        unit_price: 0,
      },
    ],
  }
}

const model = ref<CreatePurchaseReturnPayload>(createEmptyModel())

const filteredInvoices = computed(() => {
  if (!model.value.vendor_id) return vendorInvoices.value
  return vendorInvoices.value.filter((inv) => inv.vendor_id === model.value.vendor_id)
})

const totalAmount = computed(() => {
  return model.value.lines.reduce((sum, line) => {
    const qty = Number(line.quantity ?? 0)
    const unitPrice = Number(line.unit_price ?? 0)
    const total = isFinite(qty) && isFinite(unitPrice) ? qty * unitPrice : 0
    return sum + (isFinite(total) ? total : 0)
  }, 0)
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
    ;[vendors.value, products.value, vendorInvoices.value] = await Promise.all([
      listVendors(),
      listProducts(),
      listVendorInvoices(),
    ])

    if (!isCreate.value) {
      if (!props.purchaseReturnId) {
        ElMessage.error('purchaseReturnId tidak ditemukan')
        return
      }

      const pr: PurchaseReturn = await getPurchaseReturn(props.purchaseReturnId)
      model.value = {
        vendor_id: pr.vendor_id,
        purchase_invoice_id: pr.purchase_invoice_id ?? null,
        reference: pr.reference ?? null,
        date: pr.date ? String(pr.date).slice(0, 10) : null,
        total_amount: pr.total_amount,
        lines: (pr.lines ?? []).map((l): PurchaseReturnLine => ({
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
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat purchase return'))
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

    await createPurchaseReturn(
      {
        ...model.value,
        total_amount: totalAmount.value,
      },
      autoPostOnCreate.value,
    )

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan purchase return'))
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
        <div class="text-lg font-semibold">{{ isCreate ? 'New Purchase Return' : 'Purchase Return' }}</div>
        <el-tag v-if="isCreate" :type="dirty ? 'warning' : 'success'">{{ dirty ? 'Unsaved' : 'Saved' }}</el-tag>
      </div>
      <div v-if="isCreate" class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Auto post</span>
          <el-switch v-model="autoPostOnCreate" />
        </div>
        <el-button type="primary" :loading="saving" @click="save">Save</el-button>
      </div>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-width="160px" class="max-w-[980px]">
      <el-form-item label="Vendor">
        <el-select v-model="model.vendor_id" filterable class="w-full" :disabled="!isCreate">
          <el-option v-for="v in vendors" :key="v.id" :label="`${v.code} — ${v.name}`" :value="v.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Vendor Invoice (optional)">
        <el-select v-model="model.purchase_invoice_id" filterable clearable class="w-full" :disabled="!isCreate">
          <el-option
            v-for="inv in filteredInvoices"
            :key="inv.id"
            :label="`${inv.invoice_number} (Vendor #${inv.vendor_id})`"
            :value="inv.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Reference">
        <el-input v-model="model.reference" :disabled="!isCreate" />
      </el-form-item>

      <el-form-item label="Date">
        <el-date-picker v-model="model.date" type="date" value-format="YYYY-MM-DD" :disabled="!isCreate" />
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

      <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">Total: {{ totalAmount.toFixed(2) }}</div>
    </el-form>
  </div>
</template>
