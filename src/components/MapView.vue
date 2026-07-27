<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { mapBoundaryPaths, mapLandmarks, mapWalkwayPaths } from '../data/mapObjects'
import type { Booth, FilterType, LandmarkType, PrizeStatus } from '../types'

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

const mapWidth = 701.6
const mapHeight = 992.1
const aspectRatio = mapHeight / mapWidth

function effectiveStatus(booth: Booth): PrizeStatus {
  const prizes = booth.prizes ?? []
  if (prizes.some((prize) => prize.status === 'free')) return 'free'
  if (prizes.some((prize) => prize.status === 'conditional')) return 'conditional'
  return 'none'
}

const visibleBooths = computed(() => {
  if (props.filter === 'all') return props.booths
  return props.booths.filter((booth) => effectiveStatus(booth) === props.filter)
})

function boothFill(status: PrizeStatus) {
  switch (status) {
    case 'free':
      return '#16a34a'
    case 'conditional':
      return '#f59e0b'
    case 'none':
    default:
      return '#e5e7eb'
  }
}

function boothStroke(status: PrizeStatus) {
  switch (status) {
    case 'free':
      return '#14532d'
    case 'conditional':
      return '#92400e'
    case 'none':
    default:
      return '#64748b'
  }
}

function landmarkFill(type: LandmarkType) {
  switch (type) {
    case 'entrance':
      return '#dbeafe'
    case 'ticket':
      return '#ccfbf1'
    case 'restroom':
      return '#e0e7ff'
    case 'atm':
      return '#fef3c7'
    case 'stage':
      return '#84cc16'
    case 'service':
      return '#67e8f9'
    case 'zone':
    default:
      return '#f1f5f9'
  }
}

function shouldShowBoothLabel(booth: Booth) {
  return booth.bbox.w >= 4.5 && booth.bbox.h >= 2.2
}

function handleClick(id: number) {
  emit('select', id)
}

function fitToScreen() {
  if (!mapWrapper.value) return
  const wrapperWidth = mapWrapper.value.clientWidth
  const wrapperHeight = mapWrapper.value.clientHeight
  const wrapperRatio = wrapperHeight / wrapperWidth

  scale.value = aspectRatio > wrapperRatio
    ? wrapperHeight / mapHeight
    : wrapperWidth / mapWidth
  panX.value = 0
  panY.value = 0
}

function zoomAt(clientX: number, clientY: number, delta: number) {
  if (!mapWrapper.value) return

  const rect = mapWrapper.value.getBoundingClientRect()
  const localX = clientX - rect.left - rect.width / 2
  const localY = clientY - rect.top - rect.height / 2
  const mapX = localX - panX.value
  const mapY = localY - panY.value
  const oldScale = scale.value
  const newScale = Math.max(0.3, Math.min(6, oldScale + delta))

  panX.value = localX - (mapX / oldScale) * newScale
  panY.value = localY - (mapY / oldScale) * newScale
  scale.value = newScale
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? -0.1 : 0.1)
}

function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 1) {
    isPanning.value = true
    touchStart.value = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
      panX: panX.value,
      panY: panY.value,
    }
    return
  }

  if (event.touches.length === 2) {
    isPanning.value = false
    const firstTouch = event.touches[0]
    const secondTouch = event.touches[1]
    lastTouchDistance.value = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    )
  }
}

function onTouchMove(event: TouchEvent) {
  event.preventDefault()

  if (event.touches.length === 1 && isPanning.value) {
    const deltaX = event.touches[0].clientX - touchStart.value.x
    const deltaY = event.touches[0].clientY - touchStart.value.y
    panX.value = touchStart.value.panX + deltaX
    panY.value = touchStart.value.panY + deltaY
    return
  }

  if (event.touches.length === 2) {
    const firstTouch = event.touches[0]
    const secondTouch = event.touches[1]
    const distance = Math.hypot(
      secondTouch.clientX - firstTouch.clientX,
      secondTouch.clientY - firstTouch.clientY,
    )

    if (lastTouchDistance.value > 0) {
      const delta = (distance - lastTouchDistance.value) / 300
      zoomAt(
        (firstTouch.clientX + secondTouch.clientX) / 2,
        (firstTouch.clientY + secondTouch.clientY) / 2,
        delta,
      )
    }

    lastTouchDistance.value = distance
  }
}

function onTouchEnd() {
  isPanning.value = false
  lastTouchDistance.value = 0
}

let startPan = { x: 0, y: 0, panX: 0, panY: 0 }

function onMouseDown(event: MouseEvent) {
  if (event.button !== 1 && event.button !== 2) return

  startPan = {
    x: event.clientX,
    y: event.clientY,
    panX: panX.value,
    panY: panY.value,
  }
  window.addEventListener('mousemove', onMousePan)
  window.addEventListener('mouseup', onMouseUp)
}

function onMousePan(event: MouseEvent) {
  panX.value = startPan.panX + event.clientX - startPan.x
  panY.value = startPan.panY + event.clientY - startPan.y
}

function onMouseUp() {
  window.removeEventListener('mousemove', onMousePan)
  window.removeEventListener('mouseup', onMouseUp)
}

onMounted(() => {
  fitToScreen()
  window.addEventListener('resize', fitToScreen)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitToScreen)
  window.removeEventListener('mousemove', onMousePan)
  window.removeEventListener('mouseup', onMouseUp)
})

watch(
  () => props.booths.length,
  () => {
    if (scale.value === 1 && panX.value === 0 && panY.value === 0) {
      fitToScreen()
    }
  },
)
</script>

<template>
  <div
    ref="mapWrapper"
    class="relative h-full w-full overflow-hidden bg-slate-950 select-none touch-none"
    @wheel="onWheel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mousedown="onMouseDown"
    @contextmenu.prevent
  >
    <div
      class="absolute left-1/2 top-1/2 will-change-transform"
      :style="{
        width: `${mapWidth}px`,
        height: `${mapHeight}px`,
        transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})`,
      }"
    >
      <svg
        class="h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="2026 漫畫博覽會抽象攤位地圖"
      >
        <rect x="0" y="0" width="100" height="100" fill="#0f172a" />

        <path
          v-for="path in mapBoundaryPaths"
          :key="path.id"
          :d="path.d"
          fill="#f8fafc"
          stroke="#111827"
          stroke-width="0.7"
          stroke-linejoin="round"
        />

        <path
          v-for="path in mapWalkwayPaths"
          :key="path.id"
          :d="path.d"
          fill="none"
          stroke="#cbd5e1"
          stroke-width="1.1"
          stroke-linecap="round"
          stroke-dasharray="0.8 1"
        />

        <g
          v-for="landmark in mapLandmarks"
          :key="landmark.id"
          class="pointer-events-none"
        >
          <rect
            :x="landmark.bbox.x"
            :y="landmark.bbox.y"
            :width="landmark.bbox.w"
            :height="landmark.bbox.h"
            rx="0.45"
            :fill="landmarkFill(landmark.type)"
            stroke="#475569"
            stroke-width="0.25"
          />
          <foreignObject
            :x="landmark.bbox.x"
            :y="landmark.bbox.y"
            :width="landmark.bbox.w"
            :height="landmark.bbox.h"
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              class="flex h-full w-full items-center justify-center px-0.5 text-center text-[2.4px] font-bold leading-none text-slate-700"
            >
              {{ landmark.label }}
            </div>
          </foreignObject>
        </g>

        <g
          v-for="booth in visibleBooths"
          :key="booth.id"
          class="cursor-pointer transition-opacity"
          :class="selectedId === booth.id ? 'opacity-100' : 'opacity-90 hover:opacity-100'"
          tabindex="0"
          role="button"
          :aria-label="`選擇 ${booth.name}`"
          @click.stop="handleClick(booth.id)"
          @keydown.enter.prevent="handleClick(booth.id)"
          @keydown.space.prevent="handleClick(booth.id)"
        >
          <rect
            :x="booth.bbox.x"
            :y="booth.bbox.y"
            :width="booth.bbox.w"
            :height="booth.bbox.h"
            rx="0.5"
            :fill="boothFill(effectiveStatus(booth))"
            :stroke="selectedId === booth.id ? '#ffffff' : boothStroke(effectiveStatus(booth))"
            :stroke-width="selectedId === booth.id ? 0.75 : 0.3"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-if="effectiveStatus(booth) !== 'none'"
            :cx="booth.bbox.x + booth.bbox.w - 0.9"
            :cy="booth.bbox.y + 0.9"
            r="0.7"
            fill="#ffffff"
            opacity="0.9"
          />
          <foreignObject
            v-if="shouldShowBoothLabel(booth)"
            :x="booth.bbox.x"
            :y="booth.bbox.y"
            :width="booth.bbox.w"
            :height="booth.bbox.h"
            pointer-events="none"
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              class="flex h-full w-full items-center justify-center overflow-hidden px-0.5 text-center text-[2.4px] font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
            >
              {{ booth.name }}
            </div>
          </foreignObject>
        </g>
      </svg>
    </div>

    <div class="absolute left-3 bottom-3 rounded-xl bg-white/90 px-3 py-2 text-xs text-slate-700 shadow backdrop-blur">
      <div class="font-semibold">SVG 抽象地圖</div>
      <div class="mt-1 flex gap-2">
        <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-green-600" />免費</span>
        <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-amber-500" />條件</span>
        <span class="inline-flex items-center gap-1"><i class="h-2 w-2 rounded-full bg-slate-300" />無情報</span>
      </div>
    </div>
  </div>
</template>
