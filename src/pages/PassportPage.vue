<!-- pages/PassportPage.vue -->
<template>
  <div class="passport">
    <header class="page-header">
      <h1>Паспорт честности</h1>
      <p>Демонстрация работы ГСЧ в реальном времени. События визуализируются всплывающими блоками.</p>
    </header>

    <section class="section">
      <DemoStream />
    </section>
  </div>
</template>

<script setup lang="ts">
import DemoStream from '@/components/DemoStream.vue'
</script>

<style scoped>
.passport { max-width: 1000px; margin: 0 auto; padding: 2rem; }
.page-header { text-align: center; margin-bottom: 1.25rem; }
.section { position: relative; min-height: 320px; }
</style>

