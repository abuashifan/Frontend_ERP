<script setup lang="ts">
defineProps<{ tabId: string; title: string; description?: string }>()
</script>

<template>
  <div class="p-4">
    <div class="text-lg font-semibold">{{ title }}</div>
    <div class="mt-1 text-sm text-[var(--el-text-color-secondary)]">
      {{ description ?? 'Coming soon.' }}
    </div>
  </div>
</template>
