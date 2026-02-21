<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import {
  ensureAccountingPeriods,
  getBootstrap,
  getCompanySettings,
  setupCompany,
  updateCompanySettings,
  type SetupCompanyPayload,
} from '../lib/api/modules/system'
import { useTenantStore } from '../stores/tenant'

const tenantStore = useTenantStore()

const loading = ref(false)
const bootstrapLoading = ref(false)
const settingsLoading = ref(false)
const saving = ref(false)

const setupRequired = ref(false)
const companiesCount = ref(0)
const singleCompanyId = ref<number | null>(null)
const company = ref<null | {
  id: number
  code: string
  name: string
  base_currency: string
  fiscal_year_start_month: number
  fiscal_year_start_year: number
  timezone: string
  is_active: boolean
}>(null)

type FormModel = {
  name: string
  code: string
  base_currency: string
  fiscal_year_start_month: number
  fiscal_year_start_year: number
  timezone: string
  is_active: boolean
}

const form = ref<FormModel>({
  name: '',
  code: '',
  base_currency: 'IDR',
  fiscal_year_start_month: 1,
  fiscal_year_start_year: new Date().getFullYear(),
  timezone: 'Asia/Jakarta',
  is_active: true,
})

const profile = ref({
  address: '',
  city_postal: '',
  start_date: '',
  period_running_months: 12,
  warning_before_months: 0,
  warning_before_years: 0,
  error_before_months: 0,
  error_before_years: 0,
  tax_invoice_series: '',
  npwp: '',
  npwp_registration: '',
  pkp_number: '',
  pkp_date: '',
  tax_payment_date: '',
})

function asString(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function asNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function applyCompanyToForm(next: typeof company.value) {
  if (!next) return
  form.value = {
    name: next.name ?? '',
    code: next.code ?? '',
    base_currency: next.base_currency ?? 'IDR',
    fiscal_year_start_month: next.fiscal_year_start_month ?? 1,
    fiscal_year_start_year: next.fiscal_year_start_year ?? new Date().getFullYear(),
    timezone: next.timezone ?? 'Asia/Jakarta',
    is_active: Boolean(next.is_active),
  }
}

function applyProfileToForm(raw: Record<string, unknown> | null | undefined) {
  const p = raw ?? {}
  profile.value = {
    address: asString(p.address),
    city_postal: asString(p.city_postal),
    start_date: asString(p.start_date),
    period_running_months: asNumber(p.period_running_months, 12),
    warning_before_months: asNumber(p.warning_before_months, 0),
    warning_before_years: asNumber(p.warning_before_years, 0),
    error_before_months: asNumber(p.error_before_months, 0),
    error_before_years: asNumber(p.error_before_years, 0),
    tax_invoice_series: asString(p.tax_invoice_series),
    npwp: asString(p.npwp),
    npwp_registration: asString(p.npwp_registration),
    pkp_number: asString(p.pkp_number),
    pkp_date: asString(p.pkp_date),
    tax_payment_date: asString(p.tax_payment_date),
  }
}

const desiredCompanyId = computed(() => {
  if (singleCompanyId.value) return String(singleCompanyId.value)
  if (company.value?.id) return String(company.value.id)
  return null
})

async function refreshBootstrap() {
  bootstrapLoading.value = true
  try {
    const res = await getBootstrap()
    setupRequired.value = res.data.setupRequired
    companiesCount.value = res.data.companiesCount
    singleCompanyId.value = res.data.singleCompanyId
    company.value = res.data.company

    if (company.value) {
      applyCompanyToForm(company.value)
    }
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal memuat bootstrap'))
  } finally {
    bootstrapLoading.value = false
  }
}

async function refreshSettings() {
  // Only meaningful after initial company exists.
  if (setupRequired.value) return

  settingsLoading.value = true
  try {
    const res = await getCompanySettings()
    company.value = res.data.company
    applyCompanyToForm(res.data.company)
    applyProfileToForm(res.data.profile)
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal memuat company settings'))
  } finally {
    settingsLoading.value = false
  }
}

function syncTenantCompanyId() {
  const next = desiredCompanyId.value
  if (!next) {
    ElMessage.warning('Tidak ada company untuk diset')
    return
  }

  tenantStore.setActiveCompanyId(next)
  ElMessage.success(`Company context diset ke ${next}`)
}

async function ensurePeriods() {
  loading.value = true
  try {
    const res = await ensureAccountingPeriods(1, 1)
    ElMessage.success(`Accounting periods ensured. Inserted=${res.data.inserted}, skipped=${res.data.skipped_existing}`)
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal generate accounting periods'))
  } finally {
    loading.value = false
  }
}

const canSubmitCreate = computed(() => form.value.name.trim().length > 0)

async function createInitialCompany() {
  if (!canSubmitCreate.value) return

  saving.value = true
  try {
    const payload: SetupCompanyPayload = {
      name: form.value.name.trim(),
      code: form.value.code.trim() || undefined,
      base_currency: form.value.base_currency.trim() || undefined,
      fiscal_year_start_month: form.value.fiscal_year_start_month,
      fiscal_year_start_year: form.value.fiscal_year_start_year,
      timezone: form.value.timezone.trim() || undefined,
      profile: {
        address: profile.value.address.trim() || undefined,
        city_postal: profile.value.city_postal.trim() || undefined,
        start_date: profile.value.start_date || undefined,
        period_running_months: profile.value.period_running_months || undefined,
        warning_before_months: profile.value.warning_before_months || undefined,
        warning_before_years: profile.value.warning_before_years || undefined,
        error_before_months: profile.value.error_before_months || undefined,
        error_before_years: profile.value.error_before_years || undefined,
        tax_invoice_series: profile.value.tax_invoice_series.trim() || undefined,
        npwp: profile.value.npwp.trim() || undefined,
        npwp_registration: profile.value.npwp_registration.trim() || undefined,
        pkp_number: profile.value.pkp_number.trim() || undefined,
        pkp_date: profile.value.pkp_date || undefined,
        tax_payment_date: profile.value.tax_payment_date || undefined,
      },
    }

    const res = await setupCompany(payload)
    tenantStore.setActiveCompanyId(String(res.data.singleCompanyId))
    ElMessage.success('Company initialized')
    await refreshBootstrap()
    await refreshSettings()
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal setup company'))
  } finally {
    saving.value = false
  }
}

async function saveCompanySettings() {
  if (!company.value) {
    ElMessage.warning('Company belum ada')
    return
  }

  saving.value = true
  try {
    const res = await updateCompanySettings({
      name: form.value.name.trim(),
      code: form.value.code.trim() || null,
      base_currency: form.value.base_currency.trim() || null,
      fiscal_year_start_month: form.value.fiscal_year_start_month,
      fiscal_year_start_year: form.value.fiscal_year_start_year,
      timezone: form.value.timezone.trim() || null,
      is_active: form.value.is_active,
      profile: {
        address: profile.value.address.trim() || null,
        city_postal: profile.value.city_postal.trim() || null,
        start_date: profile.value.start_date || null,
        period_running_months: profile.value.period_running_months,
        warning_before_months: profile.value.warning_before_months,
        warning_before_years: profile.value.warning_before_years,
        error_before_months: profile.value.error_before_months,
        error_before_years: profile.value.error_before_years,
        tax_invoice_series: profile.value.tax_invoice_series.trim() || null,
        npwp: profile.value.npwp.trim() || null,
        npwp_registration: profile.value.npwp_registration.trim() || null,
        pkp_number: profile.value.pkp_number.trim() || null,
        pkp_date: profile.value.pkp_date || null,
        tax_payment_date: profile.value.tax_payment_date || null,
      },
    })

    company.value = res.data.company
    applyCompanyToForm(res.data.company)
    applyProfileToForm(res.data.profile)
    ElMessage.success('Company settings saved')
  } catch (err: unknown) {
    const maybe = err as { message?: unknown; response?: { data?: any } }
    ElMessage.error(String(maybe?.response?.data?.error?.message ?? maybe?.message ?? 'Gagal menyimpan settings'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await refreshBootstrap()
  await refreshSettings()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-3">
      <div>
        <div class="text-lg font-semibold">Company Settings</div>
        <div class="text-sm text-[var(--el-text-color-secondary)]">
          Untuk memastikan company context + accounting period siap untuk transaksi.
        </div>
      </div>

      <div class="flex items-center gap-2">
        <el-button :loading="bootstrapLoading || settingsLoading" @click="refreshBootstrap">Refresh</el-button>
        <el-button type="primary" :disabled="!desiredCompanyId" @click="syncTenantCompanyId">
          Sync Company Context
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="setupRequired"
      type="warning"
      show-icon
      title="Company setup belum dilakukan"
      description="Lengkapi form di bawah untuk membuat company pertama."
      class="mb-3"
    />

    <el-card class="mb-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">companiesCount</div>
          <div class="font-mono">{{ companiesCount }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">singleCompanyId</div>
          <div class="font-mono">{{ singleCompanyId ?? '-' }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--el-text-color-secondary)]">activeCompanyId (frontend)</div>
          <div class="font-mono">{{ tenantStore.activeCompanyId ?? '-' }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="mb-3">
      <template #header>
        <div class="font-semibold">Company</div>
      </template>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="Nama Perusahaan">
          <el-input v-model="form.name" placeholder="Nama legal perusahaan" />
        </el-form-item>

        <el-form-item label="Alamat (opsional)">
          <el-input v-model="profile.address" type="textarea" placeholder="Alamat lengkap" />
        </el-form-item>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Kota/Provinsi/Kode POS (opsional)">
            <el-input v-model="profile.city_postal" />
          </el-form-item>

          <el-form-item label="Tanggal Mulai (opsional)">
            <el-date-picker v-model="profile.start_date" type="date" placeholder="Pilih tanggal" style="width: 100%" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Kode Perusahaan (opsional)">
            <el-input v-model="form.code" placeholder="CMP001" />
          </el-form-item>

          <el-form-item label="Mata Uang">
            <el-input v-model="form.base_currency" placeholder="IDR" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Bulan Mulai Tahun Fiskal (1-12)">
            <el-input-number v-model="form.fiscal_year_start_month" :min="1" :max="12" />
          </el-form-item>

          <el-form-item label="Tahun Mulai Tahun Fiskal">
            <el-input-number v-model="form.fiscal_year_start_year" :min="2000" :max="2100" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Timezone">
            <el-input v-model="form.timezone" placeholder="Asia/Jakarta" />
          </el-form-item>

          <el-form-item label="Aktif">
            <el-switch v-model="form.is_active" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Periode Berjalan (bulan)">
            <el-input-number v-model="profile.period_running_months" :min="1" :max="60" />
          </el-form-item>

          <el-form-item label="Peringatan Jika Sebelum (Bln)">
            <el-input-number v-model="profile.warning_before_months" :min="0" :max="12" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Peringatan Jika Sebelum (Thn)">
            <el-input-number v-model="profile.warning_before_years" :min="0" :max="10" />
          </el-form-item>

          <el-form-item label="Error Jika Sebelum (Bln)">
            <el-input-number v-model="profile.error_before_months" :min="0" :max="12" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Error Jika Sebelum (Thn)">
            <el-input-number v-model="profile.error_before_years" :min="0" :max="10" />
          </el-form-item>

          <el-form-item label="Nomor Seri Faktur Pajak">
            <el-input v-model="profile.tax_invoice_series" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Nomor Pokok Wajib Pajak (NPWP)">
            <el-input v-model="profile.npwp" />
          </el-form-item>

          <el-form-item label="Nomor Pengukuhan PKP">
            <el-input v-model="profile.pkp_number" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <el-form-item label="Tanggal Pengukuhan PKP">
            <el-date-picker v-model="profile.pkp_date" type="date" placeholder="Pilih tanggal" style="width: 100%" />
          </el-form-item>

          <el-form-item label="Tanggal Pembayaran Pajak">
            <el-date-picker v-model="profile.tax_payment_date" type="date" placeholder="Pilih tanggal" style="width: 100%" />
          </el-form-item>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <el-button v-if="setupRequired" type="primary" :loading="saving" :disabled="!canSubmitCreate" @click="createInitialCompany">
            Simpan
          </el-button>
          <el-button v-else type="primary" :loading="saving" @click="saveCompanySettings">Simpan Perubahan</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="font-semibold">Maintenance</div>
      </template>

      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="font-medium">Ensure accounting periods</div>
          <div class="text-sm text-[var(--el-text-color-secondary)]">
            Membuat periode akuntansi untuk tahun lalu, tahun ini, dan tahun depan (tidak mengubah periode yang sudah ada).
          </div>
        </div>
        <el-button type="primary" :loading="loading" @click="ensurePeriods">Ensure Periods</el-button>
      </div>
    </el-card>
  </div>
</template>
