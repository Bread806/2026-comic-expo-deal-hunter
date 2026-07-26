<script setup lang="ts">
import type { FilterType } from '../types'

defineProps<{
  modelValue: FilterType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterType]
}>()

const options: { value: FilterType; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'bg-gray-800' },
  { value: 'free', label: '無條件', color: 'bg-free' },
  { value: 'conditional', label: '有條件', color: 'bg-conditional' },
]
</script>

<template>
  <div class="flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-md backdrop-blur">
    <button
      v-for="opt in options"
      :key="opt.value"
      @click="emit('update:modelValue', opt.value)"
      :class="[
        'px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
        modelValue === opt.value
          ? 'bg-gray-900 text-white'
          : 'text-gray-700 hover:bg-gray-100',
      ]"
    >
      <span v-if="opt.value !== 'all'" :class="['w-2 h-2 rounded-full', opt.color]" />
      {{ opt.label }}
    </button>
  </div>
</template>
