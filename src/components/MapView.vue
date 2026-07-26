<script setup lang="ts">
import { computed } from 'vue'
import type { Booth, FilterType } from '../types'

const props = defineProps<{
  booths: Booth[]
  selectedId?: number | null
  filter: FilterType
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

function effectiveStatus(booth: Booth): 'free' | 'conditional' | 'none' {
  const prizes = booth.prizes ?? []
  if (prizes.some((p) => p.status === 'free')) return 'free'
  if (prizes.some((p) => p.status === 'conditional')) return 'conditional'
  return 'none'
}

const visibleBooths = computed(() => {
  if (props.filter === 'all') return props.booths
  return props.booths.filter((b) => effectiveStatus(b) === props.filter)
})

function hotspotClasses(status: ReturnType<typeof effectiveStatus>) {
  const base =
    'absolute booth-hotspot rounded-sm border-2 cursor-pointer flex items-center justify-center overflow-hidden'
  switch (status) {
    case 'free':
      return `${base} bg-free-bg border-free`
    case 'conditional':
      return `${base} bg-conditional-bg border-conditional`
    case 'none':
    default:
      return `${base} bg-none-bg border-none`
  }
}

function statusDotClasses(status: ReturnType<typeof effectiveStatus>) {
  switch (status) {
    case 'free':
      return 'w-3 h-3 rounded-full bg-free shadow'
    case 'conditional':
      return 'w-3 h-3 rounded-full bg-conditional shadow'
    case 'none':
    default:
      return 'w-3 h-3 rounded-full bg-none shadow'
  }
}

function handleClick(id: number) {
  emit('select', id)
}
</script>

<template>
  <div class="relative w-full h-full select-none">
    <img
      src="/map.jpg"
      alt="漫博會場地圖"
      class="w-full h-full object-contain pointer-events-none"
      draggable="false"
    />

    <div
      v-for="booth in visibleBooths"
      :key="booth.id"
      :class="[
        hotspotClasses(effectiveStatus(booth)),
        selectedId === booth.id ? 'ring-2 ring-white shadow-lg' : '',
      ]"
      :style="{
        left: `${booth.bbox.x}%`,
        top: `${booth.bbox.y}%`,
        width: `${booth.bbox.w}%`,
        height: `${booth.bbox.h}%`,
      }"
      @click="handleClick(booth.id)"
    >
      <div class="absolute top-1 right-1" v-if="effectiveStatus(booth) !== 'none'">
        <div :class="statusDotClasses(effectiveStatus(booth))" />
      </div>
      <span
        v-if="booth.bbox.w >= 6 && booth.bbox.h >= 4"
        class="text-[10px] sm:text-xs leading-tight text-center px-1 text-gray-900 font-medium drop-shadow-sm pointer-events-none line-clamp-2"
      >
        {{ booth.name }}
      </span>
    </div>
  </div>
</template>
