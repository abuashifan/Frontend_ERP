<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import {
  createVendor,
  getVendor,
  updateVendor,
  type Vendor,
  type CreateVendorPayload,
} from '../lib/api/modules/vendors'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; vendorId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const model = ref<CreateVendorPayload>({
  code: '',
  name: '',
  tax_id: null,
  email: null,
  phone: null,
  address: null,
  is_active: true,
})

async function load() {
  if (!isEdit.value) {
    loaded.value = true
    return
  }

  if (!props.vendorId) {
    ElMessage.error('vendorId tidak ditemukan')
    return
  }

  loading.value = true
  try {
    const vendor: Vendor = await getVendor(props.vendorId)
    model.value = {
      code: vendor.code,
      name: vendor.name,
      tax_id: vendor.tax_id,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      is_active: vendor.is_active,
    }
    clearDirty()
    loaded.value = true
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat vendor'))
  } finally {
    loading.value = false
  }
}

watch(
  () => model.value,
  () => {
    if (!loaded.value) return
    markDirty()
  },
  { deep: true },
)

async function save() {
  saving.value = true
  try {
    if (isEdit.value && props.vendorId) {
      await updateVendor(props.vendorId, model.value)
      ElMessage.success('Vendor updated')
    } else {
      await createVendor(model.value)
      ElMessage.success('Vendor created')
    }
    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan vendor'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-3">
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Vendor' : 'New Vendor' }}</div>
        <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
        <el-tag v-else type="success">Saved</el-tag>
      </div>
      <el-button type="primary" :loading="saving" @click="save">Save</el-button>
    </div>

    <el-skeleton v-if="loading" rows="6" animated />

    <el-form v-else label-width="140px" class="max-w-[760px]">
      <el-form-item label="Code">
        <el-input v-model="model.code" />
      </el-form-item>

      <el-form-item label="Name">
        <el-input v-model="model.name" />
      </el-form-item>

      <el-form-item label="Tax ID">
        <el-input v-model="model.tax_id" />
      </el-form-item>

      <el-form-item label="Email">
        <el-input v-model="model.email" />
      </el-form-item>

      <el-form-item label="Phone">
        <el-input v-model="model.phone" />
      </el-form-item>

      <el-form-item label="Address">
        <el-input v-model="model.address" type="textarea" rows="3" />
      </el-form-item>

      <el-form-item label="Active">
        <el-switch v-model="model.is_active" />
      </el-form-item>
    </el-form>
  </div>
</template>
