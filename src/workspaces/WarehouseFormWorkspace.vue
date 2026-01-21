<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import {
  createWarehouse,
  getWarehouse,
  updateWarehouse,
  type Warehouse,
  type CreateWarehousePayload,
} from '../lib/api/modules/warehouses'
import { useTabDirty } from '../composables/useTabDirty'
import { useTabsStore } from '../stores/tabs'

const props = defineProps<{ tabId: string; mode: 'create' | 'edit'; warehouseId?: number }>()

const isEdit = computed(() => props.mode === 'edit')
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)

const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)
const tabsStore = useTabsStore()

const model = ref<CreateWarehousePayload>({
  code: '',
  name: '',
  address: null,
  is_active: true,
})

async function load() {
  if (!isEdit.value) {
    loaded.value = true
    return
  }

  if (!props.warehouseId) {
    ElMessage.error('warehouseId tidak ditemukan')
    return
  }

  loading.value = true
  try {
    const warehouse: Warehouse = await getWarehouse(props.warehouseId)
    model.value = {
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address,
      is_active: warehouse.is_active,
    }
    clearDirty()
    loaded.value = true
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal memuat warehouse'))
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
    if (isEdit.value && props.warehouseId) {
      await updateWarehouse(props.warehouseId, model.value)
      ElMessage.success('Warehouse updated')
    } else {
      await createWarehouse(model.value)
      ElMessage.success('Warehouse created')
    }
    clearDirty()
    tabsStore.closeChildTab(props.tabId)
  } catch (err: unknown) {
    const maybe = err as { response?: { data?: { message?: unknown } }; message?: unknown }
    ElMessage.error(String(maybe?.response?.data?.message ?? maybe?.message ?? 'Gagal menyimpan warehouse'))
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
        <div class="text-lg font-semibold">{{ isEdit ? 'Edit Warehouse' : 'New Warehouse' }}</div>
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

      <el-form-item label="Address">
        <el-input v-model="model.address" type="textarea" rows="3" />
      </el-form-item>

      <el-form-item label="Active">
        <el-switch v-model="model.is_active" />
      </el-form-item>
    </el-form>
  </div>
</template>
