<!-- components/ProgressDisplay.vue -->
<template>
  <div class="progress-display">
    <h3>Прогресс процесса: {{ statusText }}</h3>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>

    <div class="stages">
      <div
        v-for="stage in stages"
        :key="stage"
        class="stage-item"
        :class="{ active: isStageActive(stage) }"
      >
        {{ getStageName(stage) }}
      </div>
    </div>

    <div v-if="currentStageMessage" class="current-stage">
      Текущее действие: {{ currentStageMessage }}
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StreamEvent } from '@/types/draw'

interface Props {
  stages: string[]
  streamEvents: StreamEvent[]
  status: string
}

const props = defineProps<Props>()

const stageNames: Record<string, string> = {
  entropy: 'Сбор энтропии',
  whitening: 'Нормализация (whitening)',
  seed: 'Формирование seed',
  draw: 'Розыгрыш',
  tests: 'Проверка тестами',
  final: 'Завершение',
}

const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    pending: 'ожидает',
    running: 'выполняется',
    completed: 'завершён',
    failed: 'ошибка',
  }
  return statusMap[props.status] || props.status
})

const progress = computed(() => {
  const stageWeights: Record<string, number> = {
    entropy: 10,
    whitening: 25,
    seed: 45,
    draw: 70,
    tests: 90,
    final: 100,
  }

  const activeStage = props.stages[props.stages.length - 1]!
  return stageWeights[activeStage] || 0
})

const currentStageMessage = computed(() => {
  if (props.streamEvents.length === 0) return ''
  const lastEvent = props.streamEvents[props.streamEvents.length - 1]!
  const d = (lastEvent as any).data || {}
  if (typeof d === 'string') return d
  return d.message || d.msg || d.note || ''
})

const isStageActive = (stage: string) => {
  return props.stages.includes(stage)
}

const getStageName = (stage: string) => {
  return stageNames[stage] || stage
}
</script>

<style scoped>
.progress-display {
  margin: 2rem 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  transition: width 0.3s ease;
}

.stages {
  display: flex;
  justify-content: space-between;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.stage-item {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 0.875rem;
  margin: 0.25rem;
  background-color: #f8f9fa;
}

.stage-item.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.current-stage {
  padding: 1rem;
  background-color: #e7f3ff;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}
</style>

