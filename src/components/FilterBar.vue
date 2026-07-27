<script setup lang="ts">
import type { FilterType } from '../types'

defineProps<{ modelValue: FilterType }>()
const emit = defineEmits<{ 'update:modelValue': [value: FilterType] }>()

const options: { value: FilterType; label: string; hint: string }[] = [
  { value: 'all', label: '全部攤位', hint: '顯示所有攤位' },
  { value: 'free', label: '免費', hint: '只看免費贈品' },
  { value: 'conditional', label: '有條件', hint: '只看需消費或互動的贈品' },
]
</script>

<template>
  <nav class="filter-bar" aria-label="篩選攤位優惠">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="['filter-button', `filter-button--${option.value}`, { 'is-active': modelValue === option.value }]"
      :aria-pressed="modelValue === option.value"
      :title="option.hint"
      @click="emit('update:modelValue', option.value)"
    >
      <span class="filter-dot" aria-hidden="true"></span>{{ option.label }}
    </button>
  </nav>
</template>
