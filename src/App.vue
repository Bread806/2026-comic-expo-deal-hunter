<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Booth, FilterType, Prize, PrizeStatus } from './types'
import MapView from './components/MapView.vue'
import FilterBar from './components/FilterBar.vue'
import PrizeForm from './components/PrizeForm.vue'
import { fetchBooths, fetchPrizes, savePrize } from './composables/useSupabase'

const booths = ref<Booth[]>([])
const prizes = ref<Prize[]>([])
const filter = ref<FilterType>('all')
const selectedBoothId = ref<number | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const editingPrize = ref<Prize | null>(null)
const showForm = ref(false)

const selectedBooth = computed(() => booths.value.find((booth) => booth.id === selectedBoothId.value))

function mergePrizes() {
  booths.value = booths.value.map((booth) => ({
    ...booth,
    prizes: prizes.value.filter((prize) => prize.booth_id === booth.id),
  }))
}

onMounted(async () => {
  try {
    const [boothData, prizeData] = await Promise.all([fetchBooths(), fetchPrizes()])
    booths.value = boothData
    prizes.value = prizeData
    mergePrizes()
  } catch (err: any) {
    error.value = err?.message || '載入攤位資訊失敗，請重新整理後再試。'
  } finally {
    loading.value = false
  }
})

function onSelectBooth(id: number) {
  selectedBoothId.value = id
  showForm.value = false
  editingPrize.value = null
}

function closePanel() {
  selectedBoothId.value = null
  showForm.value = false
  editingPrize.value = null
}

function startAdd() {
  editingPrize.value = null
  showForm.value = true
}

function startEdit(prize: Prize) {
  editingPrize.value = prize
  showForm.value = true
}

async function onSavePrize(data: Omit<Prize, 'id' | 'created_at' | 'updated_at'>) {
  if (!selectedBoothId.value) return
  saving.value = true
  error.value = ''
  try {
    await savePrize({
      ...data,
      booth_id: selectedBoothId.value,
      id: editingPrize.value?.id,
      status: data.status as PrizeStatus,
    } as any)
    prizes.value = await fetchPrizes()
    mergePrizes()
    showForm.value = false
    editingPrize.value = null
  } catch (err: any) {
    error.value = err?.message || '儲存贈品資訊失敗，請稍後再試。'
  } finally {
    saving.value = false
  }
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const date = new Date(iso)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="expo-app">
    <header class="expo-header">
      <div class="brand-lockup">
        <p class="eyebrow">COMIC EXHIBITION 2026</p>
        <h1>漫博優惠雷達</h1>
        <p class="brand-caption">鎖定攤位，收集現場限定好康</p>
      </div>
      <FilterBar v-model="filter" />
    </header>

    <main class="map-stage" aria-label="漫博攤位地圖">
      <MapView :booths="booths" :filter="filter" :selected-id="selectedBoothId" @select="onSelectBooth" />
    </main>

    <Transition name="sheet">
      <section v-if="selectedBooth" class="booth-sheet" aria-labelledby="booth-title">
        <div class="sheet-handle" aria-hidden="true"></div>
        <div class="sheet-header">
          <div>
            <p class="eyebrow">攤位資料 · #{{ selectedBooth.id }}</p>
            <h2 id="booth-title">{{ selectedBooth.name }}</h2>
          </div>
          <button class="icon-button" type="button" aria-label="關閉攤位資料" @click="closePanel">×</button>
        </div>

        <div class="sheet-content">
          <PrizeForm
            v-if="showForm"
            :booth-id="selectedBooth.id"
            :initial-prize="editingPrize"
            @save="onSavePrize"
            @cancel="showForm = false; editingPrize = null"
          />

          <div v-else class="prize-list">
            <p v-if="!selectedBooth.prizes?.length" class="empty-state">這個攤位還沒有優惠情報。先新增一筆，讓下一位獵人少走冤枉路。</p>
            <article v-for="prize in selectedBooth.prizes" :key="prize.id" class="prize-card" :class="`prize-card--${prize.status}`">
              <div class="prize-card__topline">
                <h3>{{ prize.name }}</h3>
                <span class="status-badge" :class="`status-badge--${prize.status}`">
                  {{ prize.status === 'free' ? '免費贈品' : prize.status === 'conditional' ? '條件贈品' : '暫無贈品' }}
                </span>
              </div>
              <p v-if="prize.condition" class="prize-detail">{{ prize.condition }}</p>
              <p v-if="prize.quantity" class="prize-meta">數量／備註：{{ prize.quantity }}</p>
              <p class="prize-meta">
                <span v-if="prize.editor_name">回報者 {{ prize.editor_name }}</span>
                <span v-if="prize.updated_at"> · 更新於 {{ formatTime(prize.updated_at) }}</span>
              </p>
              <button type="button" class="text-action" @click="startEdit(prize)">編輯這筆情報</button>
            </article>
            <button type="button" class="primary-button" :disabled="saving" @click="startAdd">
              {{ saving ? '儲存中…' : '新增優惠情報' }}
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <div v-if="loading || saving" class="loading-layer" role="status" aria-live="polite">
      <div class="loading-card"><span class="loading-mark" aria-hidden="true"></span>{{ saving ? '正在儲存情報…' : '正在展開漫博地圖…' }}</div>
    </div>

    <div v-if="error" class="error-toast" role="alert">
      <span>{{ error }}</span>
      <button type="button" aria-label="關閉錯誤訊息" @click="error = ''">×</button>
    </div>
  </div>
</template>
