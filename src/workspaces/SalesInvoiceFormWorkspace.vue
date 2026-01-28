<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { listCustomers, type Customer } from '../lib/api/modules/customers'
import { listProducts, type Product } from '../lib/api/modules/products'
import { listWarehouses, type Warehouse } from '../lib/api/modules/warehouses'
import {
  createSalesInvoice,
  getSalesInvoice,
  updateSalesInvoice,
  type CreateSalesInvoicePayload,
  type SalesInvoice,
  type SalesInvoiceLine,
} from '../lib/api/modules/salesInvoices'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; invoiceId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const customers = ref<Customer[]>([])
const products = ref<Product[]>([])
const warehouses = ref<Warehouse[]>([])
const notes = ref('')
const discountAmount = ref<string>('')

const activeSectionTab = ref<'detail' | 'down_payment' | 'info' | 'charges' | 'docs'>('detail')

const focusedFieldKey = ref<string | null>(null)

function focusField(key: string) {
  focusedFieldKey.value = key
}

function blurField() {
  focusedFieldKey.value = null
}

function isFocused(key: string) {
  return focusedFieldKey.value === key
}

const productsById = computed(() => {
  return new Map(products.value.map((p) => [p.id, p]))
})

const canChooseProduct = computed(() => {
  return model.value.customer_id > 0 && Boolean(model.value.invoice_number?.trim())
})

function parseMoney(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0
  if (typeof input === 'number') return isFinite(input) ? input : 0
  const cleaned = String(input)
    .trim()
    .replace(/,/g, '')
    .replace(/[^0-9.-]/g, '')
  const n = Number.parseFloat(cleaned)
  return isFinite(n) ? n : 0
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const qtyFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' && value.trim() === '') return ''
  return moneyFormatter.format(parseMoney(value))
}

function moneyInputParser(value: string): string {
  if (!value) return ''
  return String(parseMoney(value))
}

function formatQty(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' && value.trim() === '') return ''
  const n = Math.trunc(parseMoney(value))
  return qtyFormatter.format(isFinite(n) ? n : 0)
}

function qtyInputParser(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9]/g, '')
  const n = Number.parseInt(cleaned || '0', 10)
  return Number.isFinite(n) ? n : 0
}

function setDiscountInput(value: string) {
  discountAmount.value = moneyInputParser(value)
}

function setTaxInput(value: string) {
  model.value.tax_amount = moneyInputParser(value)
}

function createEmptyModel(): CreateSalesInvoicePayload {
  return {
    customer_id: 0,
    warehouse_id: null,
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: new Date().toISOString().slice(0, 10),
    currency_code: 'IDR',
    exchange_rate: 1,
    tax_amount: '',
    lines: [
      {
        product_id: null,
        description: '',
        qty: 1,
        unit_price: '',
        tax_id: null,
      },
    ],
  }
}

const model = ref<CreateSalesInvoicePayload>(createEmptyModel())

const lineSubtotal = computed(() => {
  return model.value.lines.reduce((sum, line) => {
    const qty = parseMoney(line.qty)
    const unitPrice = parseMoney(line.unit_price)
    const lineTotal = isFinite(qty) && isFinite(unitPrice) ? qty * unitPrice : 0
    return sum + (isFinite(lineTotal) ? lineTotal : 0)
  }, 0)
})

const discountNumber = computed(() => {
  return parseMoney(discountAmount.value)
})

const grandTotal = computed(() => {
  const tax = Number(model.value.tax_amount ?? 0)
  const safeTax = isFinite(tax) ? tax : 0
  return lineSubtotal.value - discountNumber.value + safeTax
})

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

watch(
  () => discountAmount.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
)

watch(
  () => notes.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
)

function addLine() {
  model.value.lines.push({
    product_id: null,
    description: '',
    qty: 1,
    unit_price: '',
    tax_id: null,
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
    const [c, p, w] = await Promise.all([listCustomers(), listProducts(), listWarehouses()])
    customers.value = c
    products.value = p
    warehouses.value = w

    if (isEdit.value) {
      if (!props.invoiceId) {
        ElMessage.error('invoiceId tidak ditemukan')
        return
      }

      const invoice: SalesInvoice = await getSalesInvoice(props.invoiceId)
      model.value = {
        customer_id: invoice.customer_id,
        warehouse_id: invoice.warehouse_id ?? null,
        invoice_number: invoice.invoice_number,
        invoice_date: String(invoice.invoice_date).slice(0, 10),
        due_date: String(invoice.due_date).slice(0, 10),
        currency_code: invoice.currency_code,
        exchange_rate: parseMoney(invoice.exchange_rate),
        tax_amount: parseMoney(invoice.tax_amount),
        source_type: invoice.source_type,
        source_id: invoice.source_id,
        lines: (invoice.lines ?? []).map((l): SalesInvoiceLine => ({
          id: l.id,
          product_id: l.product_id ?? null,
          description: l.description ?? '',
          qty: Math.trunc(parseMoney(l.qty)),
          unit_price: String(parseMoney(l.unit_price)),
          tax_id: l.tax_id ?? null,
        })),
      }

      // NOTE: Invoice-level discount is shown in UI but not persisted yet.
      discountAmount.value = ''
      notes.value = ''
    }

    loaded.value = true
    clearDirty()
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(
      String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat sales invoice'),
    )
  } finally {
    loading.value = false
  }
}

function resetForCreateOnClose() {
  loaded.value = false
  saving.value = false
  loading.value = false
  model.value = createEmptyModel()
  discountAmount.value = ''
  notes.value = ''
  clearDirty()
}

async function save() {
  saving.value = true
  try {
    // These fields are configured elsewhere, but still required by the API payload.
    if (!model.value.due_date) model.value.due_date = model.value.invoice_date
    if (!model.value.currency_code) model.value.currency_code = 'IDR'
    if (model.value.exchange_rate === null || model.value.exchange_rate === undefined || model.value.exchange_rate === '') {
      model.value.exchange_rate = 1
    }

    if (!model.value.customer_id || model.value.customer_id <= 0) {
      ElMessage.warning('Customer wajib diisi')
      return
    }

    if (!model.value.warehouse_id || model.value.warehouse_id <= 0) {
      ElMessage.warning('Warehouse wajib diisi')
      return
    }

    if (!model.value.invoice_number?.trim()) {
      ElMessage.warning('Invoice number wajib diisi')
      return
    }

    if (!model.value.invoice_date) {
      ElMessage.warning('Invoice date wajib diisi')
      return
    }

    if (!model.value.currency_code || model.value.currency_code.length !== 3) {
      ElMessage.warning('Currency code wajib 3 huruf')
      return
    }

    if (!model.value.lines || model.value.lines.length < 1) {
      ElMessage.warning('Minimal 1 line')
      return
    }

    for (const [i, line] of model.value.lines.entries()) {
      if (!line.product_id) {
        ElMessage.warning(`Line ${i + 1}: product wajib dipilih`)
        return
      }

      const qty = Math.trunc(parseMoney(line.qty))
      if (qty <= 0) {
        ElMessage.warning(`Line ${i + 1}: qty harus > 0`)
        return
      }

      const unitPrice = parseMoney(line.unit_price)
      if (unitPrice <= 0) {
        ElMessage.warning(`Line ${i + 1}: unit price harus > 0`)
        return
      }
    }

    // Normalisasi angka sebelum submit (hindari format dengan koma: "10,000.00")
    const payload: CreateSalesInvoicePayload = {
      ...model.value,
      exchange_rate: parseMoney(model.value.exchange_rate),
      tax_amount: parseMoney(model.value.tax_amount),
      lines: model.value.lines.map((l) => ({
        ...l,
        // Backend masih mewajibkan description. Karena UI tidak menampilkan description,
        // kita isi otomatis dari product yang dipilih.
        description:
          (l.product_id ? productsById.value.get(l.product_id)?.name : undefined) ??
          String(l.description ?? ''),
        qty: Math.trunc(parseMoney(l.qty)),
        unit_price: parseMoney(l.unit_price),
      })),
    }

    if (isEdit.value && props.invoiceId) {
      await updateSalesInvoice(props.invoiceId, payload)
      ElMessage.success('Sales invoice updated')
    } else {
      await createSalesInvoice(payload)
      ElMessage.success('Sales invoice created')
    }

    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(
      String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan sales invoice'),
    )
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})

onActivated(() => {
  // If this instance was kept alive and then its tab was closed and later reopened
  // with the same key, ensure we load again.
  if (!loaded.value && !loading.value) {
    void load()
  }
})

onDeactivated(() => {
  // KeepAlive caches instances even after tab close. We treat "tab no longer exists"
  // as a real close event and reset only for create mode.
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
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Sales Invoice' : 'New Sales Invoice' }}</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="8" animated />

    <el-form v-else label-position="top" class="max-w-[1100px]">
      <div class="grid grid-cols-12 gap-4">
        <el-form-item label="Customer" class="col-span-12 md:col-span-5" required>
          <el-select v-model="model.customer_id" filterable class="w-full">
            <el-option
              v-for="c in customers"
              :key="c.id"
              :label="`${c.code} — ${c.name}`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Warehouse" class="col-span-12 md:col-span-3" required>
          <el-select v-model="model.warehouse_id" filterable class="w-full">
            <el-option
              v-for="w in warehouses"
              :key="w.id"
              :label="`${w.code} — ${w.name}`"
              :value="w.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Invoice Number" class="col-span-12 md:col-span-2" required>
          <el-input v-model="model.invoice_number" />
        </el-form-item>

        <el-form-item label="Invoice Date" class="col-span-12 md:col-span-2" required>
          <el-date-picker v-model="model.invoice_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>

        <el-form-item label="Notes" class="col-span-12">
          <el-input v-model="notes" type="textarea" :rows="3" placeholder="Catatan (opsional)" />
        </el-form-item>
      </div>

      <el-tabs v-model="activeSectionTab" class="mt-4">
        <el-tab-pane label="Rincian Data" name="detail">
          <div class="mt-2 mb-2 flex items-center justify-between">
            <div class="text-base font-semibold">Products</div>
            <el-button size="small" @click="addLine">Add product</el-button>
          </div>

          <el-table :data="model.lines" class="w-full" border>
        <el-table-column label="#" width="60">
          <template #default="scope">
            <div class="text-center">{{ scope.$index + 1 }}</div>
          </template>
        </el-table-column>

        <el-table-column label="Product" min-width="220">
          <template #default="scope">
            <el-select
              v-model="scope.row.product_id"
              filterable
              clearable
              class="w-full"
              :disabled="!canChooseProduct"
              :placeholder="canChooseProduct ? 'Select' : 'Isi customer & invoice number dulu'"
            >
              <el-option
                v-for="p in products"
                :key="p.id"
                :label="`${p.code} — ${p.name}`"
                :value="p.id"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="Qty" width="120">
          <template #default="scope">
            <div class="flex items-center gap-2">
              <el-input
                :model-value="isFocused(`line-${scope.$index}-qty`) ? String(scope.row.qty ?? '') : formatQty(scope.row.qty)"
                @update:model-value="(v: string) => (scope.row.qty = qtyInputParser(v))"
                @focus="() => focusField(`line-${scope.$index}-qty`)"
                @blur="blurField"
                :disabled="!scope.row.product_id"
                inputmode="numeric"
                placeholder="Qty"
                class="!w-full"
              />
              <div class="text-xs text-[var(--el-text-color-secondary)] whitespace-nowrap">
                {{ scope.row.product_id ? productsById.get(scope.row.product_id)?.uom : '' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Unit Price" width="140">
          <template #default="scope">
            <template v-if="!scope.row.product_id">
              <el-input disabled placeholder="Unit Price" />
            </template>
            <template v-else>
            <el-input
              :model-value="
                isFocused(`line-${scope.$index}-unit_price`)
                  ? String(scope.row.unit_price ?? '')
                  : formatMoney(scope.row.unit_price)
              "
              @update:model-value="(v: string) => (scope.row.unit_price = moneyInputParser(v))"
              @focus="() => focusField(`line-${scope.$index}-unit_price`)"
              @blur="blurField"
              :disabled="!scope.row.product_id"
              inputmode="decimal"
              placeholder="Unit Price"
            />
            </template>
          </template>
        </el-table-column>

        <el-table-column label="" width="90" align="center">
          <template #default="scope">
            <el-button size="small" type="danger" plain @click="removeLine(scope.$index)">
              Remove
            </el-button>
          </template>
        </el-table-column>
          </el-table>

          <div class="mt-4 flex justify-end">
            <div class="w-full max-w-[420px]">
              <div class="flex items-center justify-between py-1">
                <div class="text-sm text-[var(--el-text-color-secondary)]">Sub Total</div>
                <div class="text-sm font-medium">{{ formatMoney(lineSubtotal) }}</div>
              </div>

              <div class="flex items-center justify-between gap-3 py-1">
                <div class="text-sm text-[var(--el-text-color-secondary)]">Discount</div>
                <el-input
                  :model-value="isFocused('discount') ? discountAmount : formatMoney(discountAmount)"
                  @update:model-value="setDiscountInput"
                  @focus="() => focusField('discount')"
                  @blur="blurField"
                  inputmode="decimal"
                  class="w-[180px]"
                  placeholder="Discount"
                />
              </div>

              <div class="flex items-center justify-between gap-3 py-1">
                <div class="text-sm text-[var(--el-text-color-secondary)]">Tax</div>
                <el-input
                  :model-value="isFocused('tax') ? String(model.tax_amount ?? '') : formatMoney(model.tax_amount)"
                  @update:model-value="setTaxInput"
                  @focus="() => focusField('tax')"
                  @blur="blurField"
                  inputmode="decimal"
                  class="w-[180px]"
                  placeholder="Tax"
                />
              </div>

              <div
                class="border-t border-[var(--el-border-color-light)] mt-2 pt-2 flex items-center justify-between"
              >
                <div class="text-sm font-semibold">Total</div>
                <div class="text-sm font-semibold">{{ formatMoney(grandTotal) }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Uang Muka" name="down_payment">
          <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
            Belum diimplementasikan. Rekomendasi workflow uang muka ada di catatan tim.
          </div>
        </el-tab-pane>

        <el-tab-pane label="Informasi" name="info">
          <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">Belum diimplementasikan.</div>
        </el-tab-pane>

        <el-tab-pane label="Biaya Lainnya" name="charges">
          <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">Belum diimplementasikan.</div>
        </el-tab-pane>

        <el-tab-pane label="Dokumen" name="docs">
          <div class="mt-3 text-sm text-[var(--el-text-color-secondary)]">Belum diimplementasikan.</div>
        </el-tab-pane>
      </el-tabs>
    </el-form>
  </div>
</template>
