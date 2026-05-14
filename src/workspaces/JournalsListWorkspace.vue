<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import { listJournals, type JournalListItem } from '../lib/api/modules/journals'
import { useTabsStore } from '../stores/tabs'

defineProps<{ tabId: string }>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const rows = ref<JournalListItem[]>([])

const tabsStore = useTabsStore()

const filters = ref({
  source_type: '' as string,
  source_id: '' as string,
  status: '' as string,
  journal_number: '' as string,
  date_from: '' as string,
  date_to: '' as string,
})

const knownSourceTypes = [
  'ar.sales_invoice',
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

function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Rp 0,00'
  const num = typeof value === 'number' ? value : Number(String(value))
  if (!Number.isFinite(num)) return 'Rp 0,00'
  const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
  return `Rp ${formatted}`
}

function statusTagType(status: string) {
  if (status === 'posted') return 'success'
  if (status === 'draft') return 'info'
  if (status === 'approved') return 'warning'
  if (status === 'reversed') return 'danger'
  return 'info'
}

function openDetail(row: JournalListItem) {
  const result = tabsStore.openChildTab({
    localId: `detail-${row.id}`,
    title: `Journal ${row.journal_number}`,
    component: 'JournalDetailWorkspace',
    props: { journalId: row.id },
    closable: true,
  })
  if (!result.ok) ElMessage.warning(result.message)
}

function openNew() {
  const result = tabsStore.openChildTab({
    localId: 'new',
    title: 'New Journal',
    component: 'JournalFormWorkspace',
    closable: true,
  })

  if (!result.ok) ElMessage.warning(result.message)
}
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
    rows.value = await listJournals({
      ...baseParams,
      source_type: selectedSourceType || undefined,
    })
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
        <el-button size="small" type="primary" @click="openNew">New</el-button>
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
    </el-card>

    <el-alert v-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-3" />

    <el-table v-loading="loading" :data="rows" height="calc(100vh - 330px)" class="w-full" @row-dblclick="openDetail">
      <el-table-column type="selection" width="44" />
      <el-table-column type="index" label="No" width="60" />
      <el-table-column prop="journal_number" label="No. Jurnal" min-width="180" />
      <el-table-column prop="source_label" label="Sumber" width="170" />
      <el-table-column prop="journal_date" label="Tanggal" width="120" />
      <el-table-column prop="description" label="Deskripsi" min-width="260">
        <template #default="scope">
          <div class="truncate" :title="scope.row.description">{{ scope.row.description }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="Nilai" width="160" align="right">
        <template #default="scope">
          {{ formatMoney(scope.row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="created_by_name" label="Pengguna" width="160" />
      <el-table-column prop="status" label="Status" width="120">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Aksi" width="120" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="openDetail(scope.row)">Detail</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!loading && !errorMessage && rows.length === 0" class="mt-3 text-sm text-[var(--el-text-color-secondary)]">
      Tidak ada data.
    </div>
  </div>
</template>
