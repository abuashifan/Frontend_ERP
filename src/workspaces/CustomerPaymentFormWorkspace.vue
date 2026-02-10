<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listCustomers, type Customer } from '../lib/api/modules/customers'
import { listSalesInvoices, type SalesInvoice } from '../lib/api/modules/salesInvoices'
import {
  createCustomerPayment,
  getCustomerPayment,
  updateCustomerPayment,
  type CreateCustomerPaymentPayload,
  type CustomerPayment,
  type CustomerPaymentAllocation,
} from '../lib/api/modules/customerPayments'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; customerPaymentId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const autoPostOnCreate = ref(true)

const customers = ref<Customer[]>([])
const salesInvoices = ref<SalesInvoice[]>([])

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function createEmptyModel(): CreateCustomerPaymentPayload {
  return {
    customer_id: 0,
    receipt_number: '',
    receipt_date: today(),
    receipt_method: 'cash',
    amount: 0,
    currency_code: 'IDR',
    exchange_rate: 1,
    notes: null,
    source_type: null,
    source_id: null,
    allocations: [
      {
        sales_invoice_id: 0,
        allocated_amount: 0,
      },
    ],
  }
}

const model = ref<CreateCustomerPaymentPayload>(createEmptyModel())

const allocationsTotal = computed(() => {
  return model.value.allocations.reduce((sum, a) => {
    const v = Number(a.allocated_amount ?? 0)
    return sum + (isFinite(v) ? v : 0)
  }, 0)
})

watch(
  model,
  () => {
    markDirty()
  },
  { deep: true },
)

function addAllocation() {
  model.value.allocations.push({
    sales_invoice_id: 0,
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
    ;[customers.value, salesInvoices.value] = await Promise.all([listCustomers(), listSalesInvoices()])

    if (isEdit.value) {
      if (!props.customerPaymentId) {
        ElMessage.error('customerPaymentId tidak ditemukan')
        return
      }

      const payment: CustomerPayment = await getCustomerPayment(props.customerPaymentId)

      model.value = {
        customer_id: payment.customer_id,
        receipt_number: payment.receipt_number,
        receipt_date: String(payment.receipt_date).slice(0, 10),
        receipt_method: payment.receipt_method,
        amount: payment.amount,
        currency_code: payment.currency_code,
        exchange_rate: payment.exchange_rate,
        notes: payment.notes ?? null,
        source_type: payment.source_type ?? null,
        source_id: payment.source_id ?? null,
        allocations: (payment.allocations ?? []).map((a): CustomerPaymentAllocation => ({
          id: a.id,
          sales_invoice_id: a.sales_invoice_id,
          allocated_amount: a.allocated_amount,
        })),
      }

      if (!model.value.allocations.length) model.value.allocations = createEmptyModel().allocations
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat customer payment'))
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

    if (!model.value.receipt_number) {
      ElMessage.warning('Receipt number wajib diisi')
      return
    }

    if (!model.value.receipt_date) {
      ElMessage.warning('Receipt date wajib diisi')
      return
    }

    if (!model.value.receipt_method) {
      ElMessage.warning('Receipt method wajib diisi')
      return
    }

    if (!model.value.currency_code) {
      ElMessage.warning('Currency code wajib diisi')
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
      if (!a.sales_invoice_id || a.sales_invoice_id <= 0) {
        ElMessage.warning(`Allocation ${idx + 1}: sales invoice wajib dipilih`)
        return
      }

      const alloc = Number(a.allocated_amount ?? 0)
      if (!isFinite(alloc) || alloc <= 0) {
        ElMessage.warning(`Allocation ${idx + 1}: allocated amount wajib > 0`)
        return
      }
    }

    if (isEdit.value) {
      if (!props.customerPaymentId) {
        ElMessage.error('customerPaymentId tidak ditemukan')
        return
      }
      await updateCustomerPayment(props.customerPaymentId, model.value)
    } else {
      await createCustomerPayment(model.value, autoPostOnCreate.value)
    }

    clearDirty()
    ElMessage.success('Saved')
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan customer payment'))
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
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Customer Payment' : 'New Customer Payment' }}</div>
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
      <el-form-item label="Customer">
        <el-select v-model="model.customer_id" filterable class="w-full">
          <el-option v-for="c in customers" :key="c.id" :label="`${c.code} — ${c.name}`" :value="c.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Receipt Number">
        <el-input v-model="model.receipt_number" />
      </el-form-item>

      <el-form-item label="Receipt Date">
        <el-date-picker v-model="model.receipt_date" type="date" value-format="YYYY-MM-DD" />
      </el-form-item>

      <el-form-item label="Receipt Method">
        <el-input v-model="model.receipt_method" placeholder="cash / bank / ..." />
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

        <el-table-column label="Sales Invoice" min-width="260">
          <template #default="scope">
            <el-select v-model="scope.row.sales_invoice_id" filterable class="w-full">
              <el-option
                v-for="inv in salesInvoices"
                :key="inv.id"
                :label="`${inv.invoice_number} (Customer #${inv.customer_id})`"
                :value="inv.id"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Allocated Amount" width="180">
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

      <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
        Allocations total: {{ allocationsTotal.toFixed(2) }}
      </div>
    </el-form>
  </div>
</template>
