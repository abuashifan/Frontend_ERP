<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTabDirty } from '../composables/useTabDirty'

const props = defineProps<{ tabId: string; invoiceId: string }>()

const { dirty, markDirty, clearDirty } = useTabDirty(props.tabId)

const form = ref({
  invoiceId: props.invoiceId,
  notes: '',
})

watch(
  () => form.value,
  () => markDirty(),
  { deep: true },
)

function save() {
  clearDirty()
}
</script>

<template>
  <div class="p-4">
    <div class="flex items-center gap-3">
      <h2>Sales Invoice {{ invoiceId }}</h2>
      <el-tag v-if="dirty" type="warning">Unsaved</el-tag>
      <el-tag v-else type="success">Saved</el-tag>
    </div>

    <el-form label-width="120px" class="max-w-[720px]">
      <el-form-item label="Invoice ID">
        <el-input v-model="form.invoiceId" disabled />
      </el-form-item>

      <el-form-item label="Notes">
        <el-input v-model="form.notes" type="textarea" rows="4" placeholder="Ketik sesuatu…" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="save">Save</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
