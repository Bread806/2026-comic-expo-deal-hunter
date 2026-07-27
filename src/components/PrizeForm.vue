<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Prize, PrizeStatus } from '../types'

const props = defineProps<{
  boothId: number
  initialPrize?: Prize | null
}>()

const emit = defineEmits<{
  save: [prize: Omit<Prize, 'id' | 'created_at' | 'updated_at'>]
  cancel: []
}>()

const name = ref('')
const status = ref<PrizeStatus>('free')
const condition = ref('')
const quantity = ref('')
const editorName = ref('')
const note = ref('')

watch(
  () => props.initialPrize,
  (p) => {
    if (p) {
      name.value = p.name
      status.value = p.status
      condition.value = p.condition
      quantity.value = p.quantity
      editorName.value = p.editor_name
      note.value = ''
    } else {
      name.value = ''
      status.value = 'free'
      condition.value = ''
      quantity.value = ''
      editorName.value = ''
      note.value = ''
    }
  },
  { immediate: true }
)

function submit() {
  if (!name.value.trim()) return
  emit('save', {
    booth_id: props.boothId,
    name: name.value.trim(),
    status: status.value,
    condition: condition.value.trim(),
    quantity: quantity.value.trim(),
    editor_name: editorName.value.trim(),
  })
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">獎品名稱 *</label>
      <input
        v-model="name"
        type="text"
        placeholder="例如：免費明信片、追蹤 IG 送貼紙"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">狀態 *</label>
      <div class="flex gap-2">
        <label
          v-for="s in [
            { value: 'free', label: '無條件免費', color: 'bg-free' },
            { value: 'conditional', label: '有條件免費', color: 'bg-conditional' },
            { value: 'none', label: '無或已結束', color: 'bg-none' },
          ]"
          :key="s.value"
          class="flex-1 cursor-pointer"
        >
          <input
            type="radio"
            v-model="status"
            :value="s.value"
            class="peer sr-only"
          />
          <div
            :class="[
              'text-center py-2 rounded-lg text-sm font-medium border-2 transition-all',
              'border-gray-200 text-gray-600 peer-checked:border-gray-900 peer-checked:text-gray-900',
            ]"
          >
            <span :class="['inline-block w-2 h-2 rounded-full mr-1', s.color]" />
            {{ s.label }}
          </div>
        </label>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">領取條件 / 說明{{ status === 'conditional' ? ' *' : '' }}</label>
      <textarea
        v-model="condition"
        rows="3"
        placeholder="例如：訂閱花遊工作室頻道可拿扇子、明信片；或參加完集章任務可拿 Red Bull"
        :required="status === 'conditional'"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      ></textarea>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">限量 / 數量（可選）</label>
      <input
        v-model="quantity"
        type="text"
        placeholder="例如：每日限量 100 份"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">署名（可匿名）</label>
        <input
          v-model="editorName"
          type="text"
          placeholder="你的暱稱"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">編輯備註（可選）</label>
        <input
          v-model="note"
          type="text"
          placeholder="例如：親測 14:00 還有"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
    </div>

    <div class="flex gap-3 pt-2">
      <button
        type="button"
        @click="emit('cancel')"
        class="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm"
      >
        取消
      </button>
      <button
        type="submit"
        class="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-medium text-sm"
      >
        {{ initialPrize ? '更新' : '新增' }}獎品
      </button>
    </div>
  </form>
</template>
