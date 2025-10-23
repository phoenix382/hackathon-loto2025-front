<!-- components/DemoStream.vue -->
<template>
  <div class="demo-stream">
    <div class="controls">
      <label>
        Сценарий:
        <select v-model="scenario">
          <option value="default">default</option>
          <option value="audit">audit</option>
          <option value="draw">draw</option>
        </select>
      </label>
      <button class="btn" @click="restart">Перезапустить</button>
    </div>

    <div class="log" aria-live="polite">
      <div v-for="(e, i) in events" :key="i" class="line">
        <span class="evt">{{ e.event }}</span>
        <span class="msg">{{ toMsg(e.data) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

interface DemoEvent { event: string; data: any }

const scenario = ref('default')
const events = ref<DemoEvent[]>([])
let es: EventSource | null = null

const toMsg = (d: any) => {
  if (!d) return ''
  if (typeof d === 'string') return d
  return d.message || d.msg || d.note || JSON.stringify(d)
}

const start = () => {
  stop()
  events.value = []
  es = new EventSource(`/api/demo/stream?scenario=${encodeURIComponent(scenario.value)}`)
  const push = (event: string, data: any) => events.value.push({ event, data })
  es.onmessage = (ev) => { try { push('message', JSON.parse(ev.data)) } catch { push('message', ev.data) } }
  es.addEventListener('final', (ev: MessageEvent) => { try { push('final', JSON.parse(ev.data)) } catch { push('final', ev.data) } })
}

const stop = () => { if (es) { es.close(); es = null } }
const restart = () => start()

watch(scenario, () => start())
onMounted(() => start())
onUnmounted(() => stop())
</script>

<style scoped>
.controls { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
.btn { padding: 0.5rem 0.75rem; background: #6c757d; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
.log { border: 1px solid #eee; border-radius: 8px; padding: 0.5rem; max-height: 240px; overflow: auto; background: #fafafa; }
.line { display: flex; gap: 0.5rem; padding: 0.1rem 0; font-size: 0.9rem; color: #444; }
.evt { color: #0d6efd; min-width: 120px; font-weight: 600; }
.msg { flex: 1; }
</style>

