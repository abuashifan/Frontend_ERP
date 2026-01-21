<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1 class="text-xl font-semibold">{{ msg }}</h1>

  <div class="mt-4 rounded-lg border border-gray-200 p-4">
    <button
      type="button"
      class="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
      @click="count++"
    >
      count is {{ count }}
    </button>
    <p class="mt-2 text-sm text-gray-600">
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p class="mt-4">
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the
    official Vue + Vite starter
  </p>
  <p class="mt-2">
    Learn more about IDE Support for Vue in the
    <a href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support" target="_blank"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="mt-3 text-sm text-gray-500">Click on the Vite and Vue logos to learn more</p>
</template>
