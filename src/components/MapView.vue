<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { Booth, FilterType } from '../types'

const props = defineProps<{
  booths: Booth[]
  selectedId?: number | null
  filter: FilterType
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const mapWrapper = ref<HTMLDivElement | null>(null)
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const touchStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })
const lastTouchDistance = ref(0)

const naturalWidth = 7016
const naturalHeight = 9921
const aspectRatio = naturalHeight / naturalWidth

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
    'absolute rounded-sm border cursor-pointer flex items-center justify-center overflow-hidden'
  switch (status) {
    case 'free':
      return `${base} bg-green-500/30 border-green-500 hover:bg-green-500/40`
    case 'conditional':
      return `${base} bg-amber-500/30 border-amber-500 hover:bg-amber-500/40`
    case 'none':
    default:
      return `${base} bg-gray-400/20 border-gray-400 hover:bg-gray-400/30`
  }
}

function handleClick(id: number) {
  emit('select', id)
}

function fitToScreen() {
  if (!mapWrapper.value) return
  const wrapperW = mapWrapper.value.clientWidth
  const wrapperH = mapWrapper.value.clientHeight
  const wrapperRatio = wrapperH / wrapperW

  // Fit entire map inside wrapper (like object-contain)
  if (aspectRatio > wrapperRatio) {
    scale.value = wrapperH / naturalHeight
  } else {
    scale.value = wrapperW / naturalWidth
  }
  panX.value = 0
  panY.value = 0
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoomAt(e.clientX, e.clientY, delta)
}

function zoomAt(clientX: number, clientY: number, delta: number) {
  if (!mapWrapper.value) return
  const rect = mapWrapper.value.getBoundingClientRect()
  const x = clientX - rect.left - rect.width / 2 - panX.value
  const y = clientY - rect.top - rect.height / 2 - panY.value
  const oldScale = scale.value
  const newScale = Math.max(0.3, Math.min(4, oldScale + delta))

  panX.value = (clientX - rect.left - rect.width / 2) - (x / oldScale) * newScale
  panY.value = (clientY - rect.top - rect.height / 2) - (y / oldScale) * newScale
  scale.value = newScale
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 1) {
    isPanning.value = true
    touchStart.value = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      panX: panX.value,
      panY: panY.value,
    }
  } else if (e.touches.length === 2) {
    isPanning.value = false
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    lastTouchDistance.value = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  }
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length === 1 && isPanning.value) {
    const dx = e.touches[0].clientX - touchStart.value.x
    const dy = e.touches[0].clientY - touchStart.value.y
    panX.value = touchStart.value.panX + dx
    panY.value = touchStart.value.panY + dy
  } else if (e.touches.length === 2) {
    const t1 = e.touches[0]
    const t2 = e.touches[1]
    const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
    if (lastTouchDistance.value > 0) {
      const delta = (distance - lastTouchDistance.value) / 300
      const centerX = (t1.clientX + t2.clientX) / 2
      const centerY = (t1.clientY + t2.clientY) / 2
      zoomAt(centerX, centerY, delta)
    }
    lastTouchDistance.value = distance
  }
}

function onTouchEnd() {
  isPanning.value = false
  lastTouchDistance.value = 0
}

let startPan = { x: 0, y: 0, panX: 0, panY: 0 }
function onMouseDown(e: MouseEvent) {
  if (e.button === 1 || e.button === 2) {
    startPan = { x: e.clientX, y: e.clientY, panX: panX.value, panY: panY.value }
    window.addEventListener('mousemove', onMousePan)
    window.addEventListener('mouseup', onMouseUp)
  }
}

function onMousePan(e: MouseEvent) {
  panX.value = startPan.panX + e.clientX - startPan.x
  panY.value = startPan.panY + e.clientY - startPan.y
}

function onMouseUp() {
  window.removeEventListener('mousemove', onMousePan)
  window.removeEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  fitToScreen()
  window.addEventListener('resize', fitToScreen)
})

watch(() => props.booths.length, () => {
  if (scale.value === 1 && panX.value === 0 && panY.value === 0) {
    fitToScreen()
  }
})
</script>

<template>
  <div
    ref="mapWrapper"
    class="relative w-full h-full overflow-hidden bg-gray-900 select-none touch-none"
    @wheel="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
  >
    <div
      class="absolute top-1/2 left-1/2 will-change-transform"
      :style="{
        width: `${naturalWidth}px`,
        height: `${naturalHeight}px`,
        transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`,
      }"
    >
      <img
        src="/map.jpg"
        alt="漫博會場地圖"
        class="absolute inset-0 w-full h-full object-fill pointer-events-none"
        draggable="false"
      />

      <div
        v-for="booth in visibleBooths"
        :key="booth.id"
        :class="[
          hotspotClasses(effectiveStatus(booth)),
          selectedId === booth.id ? 'ring-2 ring-white shadow-lg z-10' : '',
        ]"
        :style="{
          left: `${booth.bbox.x}%`,
          top: `${booth.bbox.y}%`,
          width: `${booth.bbox.w}%`,
          height: `${booth.bbox.h}%`,
        }"
        @click.stop="handleClick(booth.id)"
      >
        <div
          class="absolute top-1 right-1"
          v-if="effectiveStatus(booth) !== 'none'"
        >
          <div
            class="w-2.5 h-2.5 rounded-full shadow"
            :class="{
              'bg-green-500': effectiveStatus(booth) === 'free',
              'bg-amber-500': effectiveStatus(booth) === 'conditional',
              'bg-gray-400': effectiveStatus(booth) === 'none',
            }"
          />
        </div>
        <span
          v-if="booth.bbox.w >= 5 && booth.bbox.h >= 3"
          class="text-[8px] sm:text-[10px] leading-tight text-center px-0.5 text-white font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] pointer-events-none line-clamp-2"
        >
          {{ booth.name }}
        </span>
      </div>
    </div>
  </div>
</template>
