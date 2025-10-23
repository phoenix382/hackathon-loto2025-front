<!-- components/AuditForm.vue -->
<template>
  <div class="audit-form">
    <h2>Аудит внешней последовательности (полный NIST)</h2>

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
      <label for="bits">Битовая строка (0/1):</label>
      <textarea id="bits" v-model="bits" rows="6" class="input" placeholder="Пример: 01011010..."></textarea>
      <div class="actions">
        <button class="btn" :disabled="!bits.trim() || busy" @click="runNistFromBits">Запустить NIST</button>
      </div>
    </div>

    <div v-if="activeTab === 'numbers'" class="panel">
      <label for="numbers">Список чисел (через запятую):</label>
      <input id="numbers" v-model="numbers" type="text" class="input" placeholder="12,7,33,45,3" />
      <div class="actions">
        <button class="btn" :disabled="!numbers.trim() || busy" @click="runNistFromNumbers">Запустить NIST</button>
      </div>
    </div>

    <div v-if="activeTab === 'file'" class="panel">
      <label class="file-label">
        Файл с битами (текст 0/1):
        <input class="file-input" type="file" @change="onFile" accept=".txt" />
      </label>
      <div class="actions">
        <button class="btn" :disabled="!file || busy" @click="runNistFromFile">Запустить NIST</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AuditInput, NistStartResponse } from '@/types/audit'

interface Emits { (e: 'nistStart', jobId: string): void }
const emit = defineEmits<Emits>()

const tabs = [
  { value: 'bits', label: 'Битовая строка' },
  { value: 'numbers', label: 'Список чисел' },
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
const runNistFromFile = async () => {
  if (!file.value) return
  busy.value = true
  try {
    const text = await file.value.text()
    const bitstr = (text.match(/[01]/g) || []).join('')
    await runNist({ sequence_bits: bitstr, numbers: null })
  } finally {
    busy.value = false
  }
}

const onFile = (e: Event) => {
  const t = e.target as HTMLInputElement
  file.value = t.files?.[0] ?? null
}
</script>

<style scoped>
.audit-form { max-width: 900px; margin: 0 auto; }
.tabs { display: flex; gap: 0.5rem; margin: 1rem 0 1.5rem; }
.tab { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 999px; background: #f8f9fa; cursor: pointer; transition: background-color .2s ease, color .2s ease, transform .2s ease, border-color .2s ease; }
.tab:hover { transform: translateY(-1px); }
.tab.active { background: #007bff; color: #fff; border-color: #007bff; }
.panel { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; animation: fade-in .25s ease both; }
.input { width: 100%; padding: 0.65rem 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; transition: border-color .2s ease, box-shadow .2s ease; }
.input:focus { outline: none; border-color: #007bff; box-shadow: 0 0 0 3px rgba(13,110,253,.15); }
.actions { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
.btn { padding: 0.6rem 1rem; background: #007bff; color: #fff; border: 0; border-radius: 6px; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.btn:active { transform: translateY(0) scale(.98); }
.file-label { display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 0.5rem; }
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
.file-input { font-size: 0.95rem; }
.file-input::-webkit-file-upload-button { padding: 0.6rem 1rem; border: 1px solid #007bff; background: #007bff; color: #fff; border-radius: 6px; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease; }
.file-input::file-selector-button { padding: 0.6rem 1rem; border: 1px solid #007bff; background: #007bff; color: #fff; border-radius: 6px; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease, background-color .18s ease, border-color .18s ease; }
.file-input:hover::-webkit-file-upload-button, .file-input:hover::file-selector-button { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.file-input:active::-webkit-file-upload-button, .file-input:active::file-selector-button { transform: translateY(0) scale(.98); }
.file-input:focus-visible { outline: none; }
</style>


