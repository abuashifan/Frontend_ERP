<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listJournals, type Journal } from '../lib/api/modules/journals'

defineProps<{ tabId: string }>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<Journal[]>([])

const filters = ref({
  source_type: '' as string,
  source_id: '' as string,
  status: '' as string,
  journal_number: '' as string,
  date_from: '' as string,
  date_to: '' as string,
})

const groupByTransaction = ref(true)
const combineSalesInvoiceCogs = ref(true)

const knownSourceTypes = [
  'ar.sales_invoice',
  'inventory.cogs',
  'ap.vendor_invoice',
  'ap.vendor_payment',
  'ar.customer_payment',
  'down_payment',
  'manual',
]

const canSearch = computed(() => {
  return (
    filters.value.source_type.trim() !== '' ||
    filters.value.source_id.trim() !== '' ||
    filters.value.status.trim() !== '' ||
    filters.value.journal_number.trim() !== '' ||
    filters.value.date_from.trim() !== '' ||
    filters.value.date_to.trim() !== ''
  )
})

function sumDebit(row: Journal) {
  return row.lines.reduce((acc, ln) => acc + Number(ln.debit ?? 0), 0)
}

function sumCredit(row: Journal) {
  return row.lines.reduce((acc, ln) => acc + Number(ln.credit ?? 0), 0)
}

type JournalGroupRow = {
  key: string
  source_id: number | null
  source_type: string
  journals: Journal[]
  total_debit: number
  total_credit: number
  journal_dates: string[]
}

const groupedRows = computed<JournalGroupRow[]>(() => {
  if (!groupByTransaction.value) return []

  const isCombinedSalesInvoice =
    filters.value.source_type.trim() === 'ar.sales_invoice' && combineSalesInvoiceCogs.value

  const map = new Map<string, JournalGroupRow>()

  for (const j of rows.value) {
    const sourceId = j.source_id ?? null

    // If combining sales invoice journals, group only by source_id.
    // Otherwise group by (source_type, source_id).
    const key = isCombinedSalesInvoice
      ? `sales-invoice:${sourceId ?? 'null'}`
      : `${j.source_type}:${sourceId ?? 'null'}`

    const row = map.get(key) ?? {
      key,
      source_id: sourceId,
      source_type: isCombinedSalesInvoice ? 'sales_invoice' : j.source_type,
      journals: [],
      total_debit: 0,
      total_credit: 0,
      journal_dates: [],
    }

    row.journals.push(j)
    row.total_debit += sumDebit(j)
    row.total_credit += sumCredit(j)
    row.journal_dates.push(j.journal_date)

    map.set(key, row)
  }

  return Array.from(map.values()).map((g) => {
    g.journals.sort((a, b) => b.id - a.id)
    g.journal_dates = Array.from(new Set(g.journal_dates)).sort()
    return g
  })
})

async function load() {
  loading.value = true
  errorMessage.value = null

  try {
    const baseParams = {
      source_id: filters.value.source_id.trim() || undefined,
      status: filters.value.status.trim() || undefined,
      journal_number: filters.value.journal_number.trim() || undefined,
      date_from: filters.value.date_from.trim() || undefined,
      date_to: filters.value.date_to.trim() || undefined,
    }

    const selectedSourceType = filters.value.source_type.trim()
    const shouldCombineSalesInvoice =
      selectedSourceType === 'ar.sales_invoice' && combineSalesInvoiceCogs.value

    if (shouldCombineSalesInvoice) {
      const [ar, cogs] = await Promise.all([
        listJournals({ ...baseParams, source_type: 'ar.sales_invoice' }),
        listJournals({ ...baseParams, source_type: 'inventory.cogs' }),
      ])

      const merged = [...ar, ...cogs]
      merged.sort((a, b) => b.id - a.id)
      rows.value = merged
    } else {
      rows.value = await listJournals({
        ...baseParams,
        source_type: selectedSourceType || undefined,
      })
    }
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    const message = maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat journals'
    errorMessage.value = String(message)
    ElMessage.error(errorMessage.value)
  } finally {
    loading.value = false
  }
}

function reset() {
  filters.value = {
    source_type: '',
    source_id: '',
    status: '',
    journal_number: '',
    date_from: '',
    date_to: '',
  }
  groupByTransaction.value = true
  combineSalesInvoiceCogs.value = true
  void load()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div>
        <div class="text-lg font-semibold">GL History (Journals)</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          Cari jurnal berdasarkan transaksi (source_type + source_id) atau tanggal.
        </div>
      </div>
      <div class="flex items-center gap-2">
        <el-button size="small" :loading="loading" @click="load">Refresh</el-button>
      </div>
    </div>

    <el-card class="mb-3">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">source_type</div>
          <el-select v-model="filters.source_type" filterable clearable placeholder="Pilih / ketik" class="w-full">
            <el-option v-for="t in knownSourceTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">source_id</div>
          <el-input v-model="filters.source_id" placeholder="Contoh: 123" clearable />
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">status</div>
          <el-select v-model="filters.status" clearable placeholder="(any)" class="w-full">
            <el-option label="posted" value="posted" />
            <el-option label="draft" value="draft" />
            <el-option label="reversed" value="reversed" />
          </el-select>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">journal_number</div>
          <el-input v-model="filters.journal_number" placeholder="Cari nomor jurnal" clearable />
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">date_from</div>
          <el-date-picker v-model="filters.date_from" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)] mb-1">date_to</div>
          <el-date-picker v-model="filters.date_to" type="date" value-format="YYYY-MM-DD" class="w-full" />
        </div>
      </div>

      <div class="flex items-center justify-between mt-3">
        <div class="text-xs text-[var(--el-text-color-secondary)]">
          Tip: untuk lihat jurnal Sales Invoice, set <code>source_type=ar.sales_invoice</code> dan <code>source_id=(invoice id)</code>.
        </div>
        <div class="flex items-center gap-2">
          <el-button size="small" :disabled="!canSearch" @click="reset">Reset</el-button>
          <el-button size="small" type="primary" :loading="loading" @click="load">Search</el-button>
        </div>
      </div>

      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center gap-4">
          <el-switch v-model="groupByTransaction" active-text="Group per transaksi" />
          <el-switch
            v-if="filters.source_type === 'ar.sales_invoice'"
            v-model="combineSalesInvoiceCogs"
            active-text="Gabungkan AR + COGS (Sales Invoice)"
          />
        </div>
        <div class="text-xs text-[var(--el-text-color-secondary)]" v-if="filters.source_type === 'ar.sales_invoice'">
          Saat aktif, sistem akan tampilkan jurnal <code>ar.sales_invoice</code> dan <code>inventory.cogs</code> dalam 1 grup per invoice.
        </div>
      </div>
    </el-card>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table
      v-if="!groupByTransaction"
      v-loading="loading"
      :data="rows"
      height="calc(100vh - 330px)"
      class="w-full"
    >
      <el-table-column type="expand">
        <template #default="scope">
          <div class="p-2">
            <div class="text-sm font-medium mb-2">Lines</div>
            <el-table :data="scope.row.lines" size="small" class="w-full">
              <el-table-column prop="account.code" label="Account" width="140" />
              <el-table-column prop="account.name" label="Account Name" min-width="220" />
              <el-table-column prop="debit" label="Debit" width="140" />
              <el-table-column prop="credit" label="Credit" width="140" />
              <el-table-column prop="description" label="Desc" min-width="200" />
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="journal_date" label="Date" width="120" />
      <el-table-column prop="journal_number" label="#" width="180" />
      <el-table-column prop="status" label="Status" width="110">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'posted' ? 'success' : scope.row.status === 'draft' ? 'info' : 'warning'">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source_type" label="Source Type" width="170" />
      <el-table-column prop="source_id" label="Source ID" width="110" />
      <el-table-column label="Debit" width="140">
        <template #default="scope">
          {{ sumDebit(scope.row).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="Credit" width="140">
        <template #default="scope">
          {{ sumCredit(scope.row).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="Description" min-width="260" />
    </el-table>

    <el-table
      v-else
      v-loading="loading"
      :data="groupedRows"
      height="calc(100vh - 330px)"
      class="w-full"
    >
      <el-table-column type="expand">
        <template #default="scope">
          <div class="p-2">
            <div class="text-sm font-medium mb-2">Journals</div>
            <el-table :data="scope.row.journals" size="small" class="w-full">
              <el-table-column type="expand">
                <template #default="s2">
                  <div class="p-2">
                    <div class="text-sm font-medium mb-2">Lines</div>
                    <el-table :data="s2.row.lines" size="small" class="w-full">
                      <el-table-column prop="account.code" label="Account" width="140" />
                      <el-table-column prop="account.name" label="Account Name" min-width="220" />
                      <el-table-column prop="debit" label="Debit" width="140" />
                      <el-table-column prop="credit" label="Credit" width="140" />
                      <el-table-column prop="description" label="Desc" min-width="200" />
                    </el-table>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="id" label="ID" width="90" />
              <el-table-column prop="journal_date" label="Date" width="120" />
              <el-table-column prop="journal_number" label="#" width="180" />
              <el-table-column prop="status" label="Status" width="110" />
              <el-table-column prop="source_type" label="Source Type" width="170" />
              <el-table-column label="Debit" width="140">
                <template #default="s2">
                  {{ sumDebit(s2.row).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="Credit" width="140">
                <template #default="s2">
                  {{ sumCredit(s2.row).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="description" label="Description" min-width="260" />
            </el-table>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="source_type" label="Group" width="160" />
      <el-table-column prop="source_id" label="Source ID" width="120" />
      <el-table-column label="Journal Dates" min-width="160">
        <template #default="scope">
          <span class="font-mono">{{ scope.row.journal_dates.join(', ') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Journals" width="110">
        <template #default="scope">{{ scope.row.journals.length }}</template>
      </el-table-column>
      <el-table-column label="Total Debit" width="140">
        <template #default="scope">{{ scope.row.total_debit.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="Total Credit" width="140">
        <template #default="scope">{{ scope.row.total_credit.toFixed(2) }}</template>
      </el-table-column>
    </el-table>

    <div
      v-if="!loading && !errorMessage && (groupByTransaction ? groupedRows.length === 0 : rows.length === 0)"
      class="mt-3 text-sm text-[var(--el-text-color-secondary)]"
    >
      Tidak ada data.
    </div>
  </div>
</template>
