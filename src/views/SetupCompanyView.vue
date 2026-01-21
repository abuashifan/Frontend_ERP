<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import { setupCompany, type SetupCompanyPayload } from '../lib/api/modules/system'
import { useTenantStore } from '../stores/tenant'

type FormModel = {
  name: string
  code: string
  base_currency: string
  fiscal_year_start_month: number
  timezone: string
}

const router = useRouter()
const tenantStore = useTenantStore()

const loading = ref(false)
const form = ref<FormModel>({
  name: '',
  code: '',
  base_currency: 'IDR',
  fiscal_year_start_month: 1,
  timezone: 'Asia/Jakarta',
})

const canSubmit = computed(() => form.value.name.trim().length > 0)

async function submit() {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const payload: SetupCompanyPayload = {
      name: form.value.name.trim(),
      code: form.value.code.trim() || undefined,
      base_currency: form.value.base_currency.trim() || undefined,
      fiscal_year_start_month: form.value.fiscal_year_start_month,
      timezone: form.value.timezone.trim() || undefined,
    }

    const res = await setupCompany(payload)
    tenantStore.setActiveCompanyId(String(res.data.singleCompanyId))

    ElMessage.success('Company initialized')
    router.replace('/app')
  } catch (e: unknown) {
    ElMessage.error('Failed to initialize company')
    // Keep console for debugging; UI is intentionally minimal for now.
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6 bg-[var(--el-bg-color-page)]">
    <el-card class="w-full max-w-xl">
      <template #header>
        <div class="font-bold">Lengkapi Data Perusahaan Anda</div>
      </template>

      <el-form label-position="top" @submit.prevent>
        <el-form-item label="Nama Perusahaan">
          <el-input v-model="form.name" placeholder="Nama legal perusahaan" />
        </el-form-item>

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

          <el-form-item label="Timezone">
            <el-input v-model="form.timezone" placeholder="Asia/Jakarta" />
          </el-form-item>
        </div>

        <div class="flex justify-end mt-4">
          <el-button type="primary" :loading="loading" :disabled="!canSubmit" @click="submit">
            Simpan
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>
