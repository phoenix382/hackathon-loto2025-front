<!-- components/AuditForm.vue -->
<template>
  <div class="audit-form">
    <h2>Проверка последовательностей</h2>

    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ active: activeTab === t.value }"
        @click="activeTab = t.value"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="activeTab === 'bits'" class="panel">
      <label for="bits">Последовательность бит (0/1):</label>
      <textarea id="bits" v-model="bits" rows="6" class="input" placeholder="Например: 01011010..."></textarea>
      <div class="actions">
        <button class="btn" :disabled="!bits.trim() || busy" @click="analyzeBits">Проанализировать</button>
        <button class="btn secondary" :disabled="!bits.trim() || busy" @click="runNistFromBits">Запустить NIST</button>
      </div>
    </div>

    <div v-if="activeTab === 'numbers'" class="panel">
      <label for="numbers">Последовательность чисел (через запятую):</label>
      <input id="numbers" v-model="numbers" type="text" class="input" placeholder="12,7,33,45,3" />
      <div class="actions">
        <button class="btn" :disabled="!numbers.trim() || busy" @click="analyzeNumbers">Проанализировать</button>
        <button class="btn secondary" :disabled="!numbers.trim() || busy" @click="runNistFromNumbers">Запустить NIST</button>
      </div>
    </div>

    <div v-if="activeTab === 'file'" class="panel">
      <label class="file-label">
        Выберите текстовый файл (биты 0/1):
        <input type="file" @change="onFile" accept=".txt" />
      </label>
      <div class="actions">
        <button class="btn" :disabled="!file || busy" @click="uploadFile">Загрузить и проанализировать</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AuditInput, AuditResult, NistStartResponse } from '@/types/audit'

interface Emits {
  (e: 'result', result: AuditResult): void
  (e: 'nistStart', jobId: string): void
}
const emit = defineEmits<Emits>()

const tabs = [
  { value: 'bits', label: 'Биты (0/1)' },
  { value: 'numbers', label: 'Числа' },
  { value: 'file', label: 'Файл' },
] as const

const activeTab = ref<(typeof tabs)[number]['value']>('bits')
const bits = ref('')
const numbers = ref('')
const file = ref<File | null>(null)
const busy = ref(false)

const parseNumbers = (s: string) =>
  s
    .split(/[ ,;\n\t]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .map((x) => Math.trunc(x))

const analyze = async (payload: AuditInput) => {
  busy.value = true
  try {
    const res = await fetch('/api/audit/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Ошибка анализа: ${res.status}`)
    const data = (await res.json()) as AuditResult
    emit('result', data)
  } finally {
    busy.value = false
  }
}

const analyzeBits = () => analyze({ sequence_bits: bits.value, numbers: null })
const analyzeNumbers = () => analyze({ sequence_bits: null, numbers: parseNumbers(numbers.value) })

const uploadFile = async () => {
  if (!file.value) return
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    const res = await fetch('/api/audit/upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error(`Ошибка загрузки файла: ${res.status}`)
    emit('result', (await res.json()) as AuditResult)
  } finally {
    busy.value = false
  }
}

const runNist = async (payload: AuditInput) => {
  busy.value = true
  try {
    const res = await fetch('/api/audit/nist/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Ошибка запуска NIST: ${res.status}`)
    const data = (await res.json()) as NistStartResponse
    emit('nistStart', data.job_id)
  } finally {
    busy.value = false
  }
}

const runNistFromBits = () => runNist({ sequence_bits: bits.value, numbers: null })
const runNistFromNumbers = () => runNist({ sequence_bits: null, numbers: parseNumbers(numbers.value) })

const onFile = (e: Event) => {
  const t = e.target as HTMLInputElement
  file.value = t.files?.[0] ?? null
}
</script>

<style scoped>
.audit-form { max-width: 900px; margin: 0 auto; }

.tabs { display: flex; gap: 0.5rem; margin: 1rem 0 1.5rem; }
.tab { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 999px; background: #f8f9fa; cursor: pointer; }
.tab.active { background: #007bff; color: #fff; border-color: #007bff; }

.panel { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; }

.input { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }

.actions { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
.btn { padding: 0.6rem 1rem; background: #007bff; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
.btn.secondary { background: #6c757d; }

.file-label { display: block; margin-bottom: 0.5rem; }
</style>

