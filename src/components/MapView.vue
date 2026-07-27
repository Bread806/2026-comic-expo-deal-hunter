<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { mapBoundaryPaths, mapLandmarks, mapWalkwayPaths } from '../data/mapObjects'
import type { Booth, FilterType, LandmarkType, PrizeStatus } from '../types'

const props = defineProps<{ booths: Booth[]; selectedId?: number | null; filter: FilterType }>()
const emit = defineEmits<{ select: [id: number] }>()

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

const visibleBooths = computed(() => props.filter === 'all' ? props.booths : props.booths.filter((booth) => effectiveStatus(booth) === props.filter))
const filterLabel = computed(() => ({ all: '所有攤位', free: '免費贈品', conditional: '條件贈品' })[props.filter])

function boothFill(status: PrizeStatus) { return ({ free: '#ff4e9b', conditional: '#ffbd3f', none: '#4d6280' })[status] }
function boothStroke(status: PrizeStatus) { return ({ free: '#8e1b54', conditional: '#8f5600', none: '#273a58' })[status] }
function landmarkFill(type: LandmarkType) { return ({ entrance: '#55e6d0', ticket: '#9874ff', restroom: '#b7c6e7', atm: '#ffbd3f', stage: '#ff667d', service: '#63b5ff', zone: '#213657' })[type] }
function landmarkText(type: LandmarkType) { return ({ entrance: '入口', ticket: '售票', restroom: '洗手間', atm: 'ATM', stage: '舞台', service: '服務台', zone: '展區' })[type] }
function shouldShowBoothLabel(booth: Booth) { return booth.bbox.w >= 4.5 && booth.bbox.h >= 2.2 }
function handleClick(id: number) { emit('select', id) }

function fitToScreen() {
  if (!mapWrapper.value) return
  const wrapperRatio = mapWrapper.value.clientHeight / mapWrapper.value.clientWidth
  scale.value = aspectRatio > wrapperRatio ? mapWrapper.value.clientHeight / mapHeight : mapWrapper.value.clientWidth / mapWidth
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
  const nextScale = Math.max(0.3, Math.min(6, scale.value + delta))
  panX.value = localX - (mapX / scale.value) * nextScale
  panY.value = localY - (mapY / scale.value) * nextScale
  scale.value = nextScale
}

function onWheel(event: WheelEvent) { event.preventDefault(); zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? -0.1 : 0.1) }
function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 1) { isPanning.value = true; touchStart.value = { x: event.touches[0].clientX, y: event.touches[0].clientY, panX: panX.value, panY: panY.value }; return }
  if (event.touches.length === 2) { isPanning.value = false; lastTouchDistance.value = Math.hypot(event.touches[1].clientX - event.touches[0].clientX, event.touches[1].clientY - event.touches[0].clientY) }
}
function onTouchMove(event: TouchEvent) {
  event.preventDefault()
  if (event.touches.length === 1 && isPanning.value) { panX.value = touchStart.value.panX + event.touches[0].clientX - touchStart.value.x; panY.value = touchStart.value.panY + event.touches[0].clientY - touchStart.value.y; return }
  if (event.touches.length === 2) {
    const distance = Math.hypot(event.touches[1].clientX - event.touches[0].clientX, event.touches[1].clientY - event.touches[0].clientY)
    if (lastTouchDistance.value > 0) zoomAt((event.touches[0].clientX + event.touches[1].clientX) / 2, (event.touches[0].clientY + event.touches[1].clientY) / 2, (distance - lastTouchDistance.value) / 300)
    lastTouchDistance.value = distance
  }
}
function onTouchEnd() { isPanning.value = false; lastTouchDistance.value = 0 }
let startPan = { x: 0, y: 0, panX: 0, panY: 0 }
function onMouseDown(event: MouseEvent) {
  if (event.button !== 1 && event.button !== 2) return
  startPan = { x: event.clientX, y: event.clientY, panX: panX.value, panY: panY.value }
  window.addEventListener('mousemove', onMousePan)
  window.addEventListener('mouseup', onMouseUp)
}
function onMousePan(event: MouseEvent) { panX.value = startPan.panX + event.clientX - startPan.x; panY.value = startPan.panY + event.clientY - startPan.y }
function onMouseUp() { window.removeEventListener('mousemove', onMousePan); window.removeEventListener('mouseup', onMouseUp) }

onMounted(() => { fitToScreen(); window.addEventListener('resize', fitToScreen) })
onBeforeUnmount(() => { window.removeEventListener('resize', fitToScreen); window.removeEventListener('mousemove', onMousePan); window.removeEventListener('mouseup', onMouseUp) })
watch(() => props.booths.length, () => { if (scale.value === 1 && panX.value === 0 && panY.value === 0) fitToScreen() })
</script>

<template>
  <div ref="mapWrapper" class="expo-map" @wheel="onWheel" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @mousedown="onMouseDown" @contextmenu.prevent>
    <div class="map-grid" aria-hidden="true"></div>
    <div class="map-canvas" :style="{ width: `${mapWidth}px`, height: `${mapHeight}px`, transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${scale})` }">
      <svg class="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="2026 漫畫博覽會攤位探索地圖">
        <rect width="100" height="100" fill="#102544" />
        <path v-for="path in mapBoundaryPaths" :key="path.id" :d="path.d" fill="#eaf0f7" stroke="#183252" stroke-width="0.7" stroke-linejoin="round" />
        <path v-for="path in mapWalkwayPaths" :key="path.id" :d="path.d" fill="none" stroke="#c3d2df" stroke-width="1.15" stroke-linecap="round" stroke-dasharray="0.8 1" />
        <g v-for="landmark in mapLandmarks" :key="landmark.id" class="pointer-events-none">
          <rect :x="landmark.bbox.x" :y="landmark.bbox.y" :width="landmark.bbox.w" :height="landmark.bbox.h" rx="0.45" :fill="landmarkFill(landmark.type)" stroke="#17304f" stroke-width="0.25" />
          <foreignObject :x="landmark.bbox.x" :y="landmark.bbox.y" :width="landmark.bbox.w" :height="landmark.bbox.h"><div xmlns="http://www.w3.org/1999/xhtml" class="landmark-label">{{ landmarkText(landmark.type) }}</div></foreignObject>
        </g>
        <g v-for="booth in visibleBooths" :key="booth.id" class="booth-hotspot" :class="{ 'is-selected': selectedId === booth.id }" tabindex="0" role="button" :aria-label="`選擇攤位 ${booth.name}，${effectiveStatus(booth) === 'free' ? '有免費贈品' : effectiveStatus(booth) === 'conditional' ? '有條件贈品' : '暫無贈品'}`" @click.stop="handleClick(booth.id)" @keydown.enter.prevent="handleClick(booth.id)" @keydown.space.prevent="handleClick(booth.id)">
          <rect :x="booth.bbox.x" :y="booth.bbox.y" :width="booth.bbox.w" :height="booth.bbox.h" rx="0.5" :fill="boothFill(effectiveStatus(booth))" :stroke="selectedId === booth.id ? '#ffffff' : boothStroke(effectiveStatus(booth))" :stroke-width="selectedId === booth.id ? 0.75 : 0.3" vector-effect="non-scaling-stroke" />
          <circle v-if="effectiveStatus(booth) !== 'none'" :cx="booth.bbox.x + booth.bbox.w - 0.9" :cy="booth.bbox.y + 0.9" r="0.7" fill="#ffffff" opacity="0.95" />
          <foreignObject v-if="shouldShowBoothLabel(booth)" :x="booth.bbox.x" :y="booth.bbox.y" :width="booth.bbox.w" :height="booth.bbox.h" pointer-events="none"><div xmlns="http://www.w3.org/1999/xhtml" class="booth-label">{{ booth.name }}</div></foreignObject>
        </g>
      </svg>
    </div>
    <aside class="map-key" aria-label="地圖圖例"><p><span class="map-key__mark">漫博 2026</span> {{ filterLabel }}</p><div><span class="key-item key-item--free">免費</span><span class="key-item key-item--conditional">有條件</span><span class="key-item key-item--none">一般</span></div></aside>
    <div class="map-controls" aria-label="地圖縮放控制"><button type="button" aria-label="放大地圖" @click="zoomAt(mapWrapper?.getBoundingClientRect().left ?? 0, mapWrapper?.getBoundingClientRect().top ?? 0, 0.2)">+</button><button type="button" aria-label="縮小地圖" @click="zoomAt(mapWrapper?.getBoundingClientRect().left ?? 0, mapWrapper?.getBoundingClientRect().top ?? 0, -0.2)">−</button><button type="button" class="map-fit" aria-label="回到適合畫面大小" @click="fitToScreen">⌖</button></div>
  </div>
</template>
