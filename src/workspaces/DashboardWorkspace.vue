<script setup lang="ts">
defineProps<{ tabId: string }>()
</script>

<template>
  <div class="p-4">
    <h2>Dashboard</h2>
    <p>Ini adalah workspace contoh (virtual tab).</p>
    <p>Switch tab tidak akan unmount karena menggunakan <code>&lt;KeepAlive&gt;</code>.</p>
  </div>
</template>
