<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Booth, Prize, PrizeStatus, FilterType } from './types'
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

const selectedBooth = computed(() =>
  booths.value.find((b) => b.id === selectedBoothId.value)
)

function mergePrizes() {
  booths.value = booths.value.map((booth) => ({
    ...booth,
    prizes: prizes.value.filter((p) => p.booth_id === booth.id),
  }))
}

onMounted(async () => {
  try {
    const [boothData, prizeData] = await Promise.all([
      fetchBooths(),
      fetchPrizes(),
    ])
    booths.value = boothData
    prizes.value = prizeData
    mergePrizes()
  } catch (err: any) {
    error.value = err?.message || '載入失敗'
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

    const updated = await fetchPrizes()
    prizes.value = updated
    mergePrizes()
    showForm.value = false
    editingPrize.value = null
  } catch (err: any) {
    error.value = err?.message || '儲存失敗，請稍後再試'
  } finally {
    saving.value = false
  }
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-gray-100">
    <!-- Header -->
    <header
      class="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-white/90 backdrop-blur shadow-sm"
    >
      <div>
        <h1 class="text-base sm:text-lg font-bold text-gray-900 leading-tight">
          2026 漫博免費好禮地圖
        </h1>
        <p class="text-xs text-gray-500">點擊攤位查看或編輯獎品</p>
      </div>
      <FilterBar v-model="filter" />
    </header>

    <!-- Map -->
    <main class="absolute inset-0 pt-14">
      <MapView
        :booths="booths"
        :filter="filter"
        :selected-id="selectedBoothId"
        @select="onSelectBooth"
      />
    </main>

    <!-- Bottom panel for selected booth -->
    <transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div
        v-if="selectedBooth"
        class="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] max-h-[70vh] overflow-y-auto"
      >
        <div class="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between z-10">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ selectedBooth.name }}</h2>
            <p class="text-xs text-gray-500">攤位 #{{ selectedBooth.id }}</p>
          </div>
          <button
            @click="closePanel"
            class="p-2 rounded-full hover:bg-gray-100 text-gray-600"
          >
            ✕
          </button>
        </div>

        <div class="p-4">
          <div v-if="showForm">
            <PrizeForm
              :booth-id="selectedBooth.id"
              :initial-prize="editingPrize"
              @save="onSavePrize"
              @cancel="showForm = false; editingPrize = null"
            />
          </div>

          <div v-else class="space-y-4">
            <div v-if="!selectedBooth.prizes || selectedBooth.prizes.length === 0" class="text-sm text-gray-500">
              這個攤位還沒有獎品資料，歡迎新增！
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="prize in selectedBooth.prizes"
                :key="prize.id"
                class="border rounded-lg p-3"
                :class="{
                  'border-free bg-free-bg/30': prize.status === 'free',
                  'border-conditional bg-conditional-bg/30': prize.status === 'conditional',
                  'border-none bg-none-bg/30': prize.status === 'none',
                }"
              >
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-gray-900">{{ prize.name }}</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full text-white"
                    :class="{
                      'bg-free': prize.status === 'free',
                      'bg-conditional': prize.status === 'conditional',
                      'bg-none': prize.status === 'none',
                    }"
                  >
                    {{ prize.status === 'free' ? '無條件' : prize.status === 'conditional' ? '有條件' : '無/結束' }}
                  </span>
                </div>
                <p v-if="prize.condition" class="text-sm text-gray-700 mt-1">{{ prize.condition }}</p>
                <p v-if="prize.quantity" class="text-xs text-gray-500 mt-1">限量：{{ prize.quantity }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  <span v-if="prize.editor_name">編輯者：{{ prize.editor_name }} · </span>
                  <span v-if="prize.updated_at">更新於 {{ formatTime(prize.updated_at) }}</span>
                </p>
                <button
                  @click="startEdit(prize)"
                  class="mt-2 text-xs text-gray-600 underline"
                >
                  編輯此獎品
                </button>
              </div>
            </div>

            <button
              @click="startAdd"
              class="w-full py-2.5 rounded-xl bg-gray-900 text-white font-medium text-sm"
              :disabled="saving"
            >
              {{ saving ? '儲存中...' : '新增獎品' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Loading -->
    <div
      v-if="loading || saving"
      class="absolute inset-0 z-40 flex items-center justify-center bg-white/70"
    >
      <div class="text-center">
        <div class="w-10 h-10 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
        <p class="mt-3 text-sm text-gray-600">{{ saving ? '儲存中...' : '載入中...' }}</p>
      </div>
    </div>

    <!-- Error toast -->
    <div
      v-if="error"
      class="absolute bottom-4 left-4 right-4 z-50 bg-red-100 text-red-800 px-4 py-3 rounded-lg text-sm shadow"
    >
      {{ error }}
    </div>
  </div>
</template>
