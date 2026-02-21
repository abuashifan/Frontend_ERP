<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// The canonical company setup/edit form lives under Settings -> Company Settings.
// Keep this route for backward compatibility and direct users there.
onMounted(() => {
  router.replace('/app')
})
</script>

<template>
  <div class="p-4">
    <el-alert
      type="info"
      show-icon
      title="Company setup"
      description="Halaman setup dipindahkan ke Settings → Company Settings. Mengalihkan..."
    />
  </div>
</template>
