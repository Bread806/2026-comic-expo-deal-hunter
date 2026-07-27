<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Prize, PrizeStatus } from '../types'

const props = defineProps<{ boothId: number; initialPrize?: Prize | null }>()
const emit = defineEmits<{ save: [prize: Omit<Prize, 'id' | 'created_at' | 'updated_at'>]; cancel: [] }>()

const name = ref('')
const status = ref<PrizeStatus>('free')
const condition = ref('')
const quantity = ref('')
const editorName = ref('')

watch(() => props.initialPrize, (prize) => {
  name.value = prize?.name ?? ''
  status.value = prize?.status ?? 'free'
  condition.value = prize?.condition ?? ''
  quantity.value = prize?.quantity ?? ''
  editorName.value = prize?.editor_name ?? ''
}, { immediate: true })

function submit() {
  if (!name.value.trim()) return
  emit('save', { booth_id: props.boothId, name: name.value.trim(), status: status.value, condition: condition.value.trim(), quantity: quantity.value.trim(), editor_name: editorName.value.trim() })
}
</script>

<template>
  <form class="prize-form" @submit.prevent="submit">
    <p class="form-intro">{{ initialPrize ? '更新現場情報' : '回報一筆現場情報' }}</p>
    <label class="form-field"><span>贈品名稱 <b>*</b></span><input v-model="name" type="text" placeholder="例如：角色明信片、試閱小冊" required /></label>
    <fieldset class="status-fieldset"><legend>取得方式 <b>*</b></legend><div class="status-options">
      <label v-for="item in [{ value: 'free', label: '免費', note: '直接索取' }, { value: 'conditional', label: '有條件', note: '消費／互動' }, { value: 'none', label: '暫無', note: '暫不提供' } ]" :key="item.value" class="status-option">
        <input v-model="status" type="radio" :value="item.value" /><span><strong>{{ item.label }}</strong><small>{{ item.note }}</small></span>
      </label>
    </div></fieldset>
    <label class="form-field"><span>條件／領取方式{{ status === 'conditional' ? ' *' : '' }}</span><textarea v-model="condition" rows="3" :required="status === 'conditional'" placeholder="例如：消費滿 300 元，或出示追蹤畫面" /></label>
    <div class="form-grid">
      <label class="form-field"><span>數量／備註</span><input v-model="quantity" type="text" placeholder="例如：每日 100 份" /></label>
      <label class="form-field"><span>回報者名稱</span><input v-model="editorName" type="text" placeholder="暱稱即可" /></label>
    </div>
    <div class="form-actions"><button type="button" class="secondary-button" @click="emit('cancel')">取消</button><button type="submit" class="primary-button">{{ initialPrize ? '儲存變更' : '送出情報' }}</button></div>
  </form>
</template>
