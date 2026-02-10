<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listVendors, type Vendor } from '../lib/api/modules/vendors'
import { listVendorInvoices, type VendorInvoice } from '../lib/api/modules/vendorInvoices'
import {
  createVendorPayment,
  getVendorPayment,
  updateVendorPayment,
  type CreateVendorPaymentPayload,
  type VendorPayment,
  type VendorPaymentAllocation,
} from '../lib/api/modules/vendorPayments'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; vendorPaymentId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const autoPostOnCreate = ref(true)

const vendors = ref<Vendor[]>([])
const vendorInvoices = ref<VendorInvoice[]>([])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyModel(): CreateVendorPaymentPayload {
  return {
    vendor_id: 0,
    payment_number: '',
    payment_date: today(),
    payment_method: 'cash',
    amount: 0,
    currency_code: 'IDR',
    exchange_rate: 1,
    notes: null,
    source_type: null,
    source_id: null,
    allocations: [
      {
        vendor_invoice_id: 0,
        allocated_amount: 0,
      },
    ],
  }
}

const model = ref<CreateVendorPaymentPayload>(createEmptyModel())

const filteredInvoices = computed(() => {
  if (!model.value.vendor_id) return vendorInvoices.value
  return vendorInvoices.value.filter((inv) => inv.vendor_id === model.value.vendor_id)
})

const allocationsTotal = computed(() => {
  return model.value.allocations.reduce((sum, a) => {
    const v = Number(a.allocated_amount ?? 0)
    return sum + (isFinite(v) ? v : 0)
  }, 0)
})

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

function addAllocation() {
  model.value.allocations.push({
    vendor_invoice_id: 0,
    allocated_amount: 0,
  })
}

function removeAllocation(index: number) {
  if (model.value.allocations.length <= 1) return
  model.value.allocations.splice(index, 1)
}

async function load() {
  loading.value = true

  try {
    ;[vendors.value, vendorInvoices.value] = await Promise.all([listVendors(), listVendorInvoices()])

    if (isEdit.value) {
      if (!props.vendorPaymentId) {
        ElMessage.error('vendorPaymentId tidak ditemukan')
        return
      }

      const payment: VendorPayment = await getVendorPayment(props.vendorPaymentId)
      model.value = {
        vendor_id: payment.vendor_id,
        payment_number: payment.payment_number,
        payment_date: String(payment.payment_date).slice(0, 10),
        payment_method: payment.payment_method,
        amount: payment.amount,
        currency_code: payment.currency_code,
        exchange_rate: payment.exchange_rate,
        notes: payment.notes ?? null,
        source_type: payment.source_type ?? null,
        source_id: payment.source_id ?? null,
        allocations: (payment.allocations ?? []).map((a): VendorPaymentAllocation => ({
          id: a.id,
          vendor_invoice_id: a.vendor_invoice_id,
          allocated_amount: a.allocated_amount,
        })),
      }

      if (!model.value.allocations.length) model.value.allocations = createEmptyModel().allocations
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat vendor payment'))
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

    if (!model.value.payment_number) {
      ElMessage.warning('Payment number wajib diisi')
      return
    }

    if (!model.value.payment_date) {
      ElMessage.warning('Payment date wajib diisi')
      return
    }

    if (!model.value.payment_method) {
      ElMessage.warning('Payment method wajib diisi')
      return
    }

    if (!model.value.currency_code || model.value.currency_code.length !== 3) {
      ElMessage.warning('Currency code wajib 3 huruf')
      return
    }

    const amt = Number(model.value.amount ?? 0)
    if (!isFinite(amt) || amt <= 0) {
      ElMessage.warning('Amount wajib > 0')
      return
    }

    if (!model.value.allocations?.length) {
      ElMessage.warning('Allocations wajib diisi minimal 1')
      return
    }

    for (const [idx, a] of model.value.allocations.entries()) {
      if (!a.vendor_invoice_id || a.vendor_invoice_id <= 0) {
        ElMessage.warning(`Allocation ${idx + 1}: vendor invoice wajib dipilih`)
        return
      }

      const alloc = Number(a.allocated_amount ?? 0)
      if (!isFinite(alloc) || alloc <= 0) {
        ElMessage.warning(`Allocation ${idx + 1}: allocated amount wajib > 0`)
        return
      }
    }

    if (allocationsTotal.value > amt) {
      ElMessage.warning('Total allocations tidak boleh melebihi amount')
      return
    }

    if (isEdit.value) {
      if (!props.vendorPaymentId) {
        ElMessage.error('vendorPaymentId tidak ditemukan')
        return
      }
      await updateVendorPayment(props.vendorPaymentId, model.value)
    } else {
      await createVendorPayment(model.value, autoPostOnCreate.value)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan vendor payment'))
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
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Vendor Payment' : 'New Vendor Payment' }}</div>
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

    <el-form v-else label-width="160px" class="max-w-[980px]">
      <el-form-item label="Vendor">
        <el-select v-model="model.vendor_id" filterable class="w-full">
          <el-option v-for="v in vendors" :key="v.id" :label="`${v.code} — ${v.name}`" :value="v.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Payment Number">
        <el-input v-model="model.payment_number" />
      </el-form-item>

      <el-form-item label="Payment Date">
        <el-date-picker v-model="model.payment_date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="Payment Method">
        <el-input v-model="model.payment_method" placeholder="cash / bank / ..." />
      </el-form-item>

      <el-form-item label="Amount">
        <el-input v-model="model.amount" />
      </el-form-item>

      <el-form-item label="Currency Code">
        <el-input v-model="model.currency_code" maxlength="3" />
      </el-form-item>

      <el-form-item label="Exchange Rate">
        <el-input v-model="model.exchange_rate" />
      </el-form-item>

      <el-form-item label="Notes">
        <el-input v-model="model.notes" type="textarea" />
      </el-form-item>

      <div class="mt-6 mb-2 flex items-center justify-between">
        <div class="text-base font-semibold">Allocations</div>
        <el-button size="small" @click="addAllocation">Add allocation</el-button>
      </div>

      <el-table :data="model.allocations" class="w-full" border>
        <el-table-column label="#" width="60">
          <template #default="scope">
            <div class="text-center">{{ scope.$index + 1 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Vendor Invoice" min-width="340">
          <template #default="scope">
            <el-select v-model="scope.row.vendor_invoice_id" filterable class="w-full">
              <el-option
                v-for="inv in filteredInvoices"
                :key="inv.id"
                :label="`${inv.invoice_number} (Vendor #${inv.vendor_id})`"
                :value="inv.id"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Allocated Amount" width="200">
          <template #default="scope">
            <el-input v-model="scope.row.allocated_amount" />
          </template>
        </el-table-column>

        <el-table-column label="" width="90" align="center">
          <template #default="scope">
            <el-button size="small" type="danger" plain @click="removeAllocation(scope.$index)">Remove</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">Allocations total: {{ allocationsTotal.toFixed(2) }}</div>
    </el-form>
  </div>
</template>
