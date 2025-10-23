<!-- App.vue -->
<template>
  <div id="app">
    <nav class="main-nav">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">Честная лотерея</router-link>
        <div class="nav-links">
          <router-link to="/draw" class="nav-link">Розыгрыш чисел</router-link>
          <router-link to="/verify" class="nav-link">Проверка</router-link>
          <router-link to="/passport" class="nav-link">Паспорт честности</router-link>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-scale" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
  
</template>

<script setup lang="ts"></script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f8f9fa;
}

:root {
  --ease-1: cubic-bezier(.2, .7, .2, 1);
}

html { scroll-behavior: smooth; }

.main-nav { background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); position: sticky; top: 0; z-index: 100; }

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-logo { font-size: 1.5rem; font-weight: bold; color: #007bff; text-decoration: none; }

.nav-links { display: flex; gap: 2rem; }

.nav-link { color: #333; text-decoration: none; font-weight: 500; transition: color 0.2s; padding: 0.5rem 1rem; border-radius: 4px; }
.nav-link:hover, .nav-link.router-link-active { color: #007bff; background-color: #f0f6ff; }
.nav-link { transition: color .2s var(--ease-1), background-color .2s var(--ease-1), transform .2s var(--ease-1); }
.nav-link:hover { transform: translateY(-1px); }

.main-content { min-height: calc(100vh - 60px); padding: 2rem 0; }

/* Smooth UI defaults */
.btn { transition: transform .18s var(--ease-1), box-shadow .18s var(--ease-1), background-color .18s var(--ease-1), border-color .18s var(--ease-1), color .18s var(--ease-1); }
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.btn:active { transform: translateY(0) scale(.98); box-shadow: 0 2px 6px rgba(0,0,0,.06); }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(13,110,253,.25); }

.action-button { transition: transform .18s var(--ease-1), box-shadow .18s var(--ease-1), background-color .18s var(--ease-1); }
.action-button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.action-button:active { transform: translateY(0) scale(.98); }

.card { transition: transform .25s var(--ease-1), box-shadow .25s var(--ease-1), border-color .25s var(--ease-1); }
.card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,.08); border-color: #e2e8f0; }

.input, input, textarea, select { transition: border-color .2s var(--ease-1), box-shadow .2s var(--ease-1), background-color .2s var(--ease-1); }

.chip, .tab, .badge { transition: background-color .2s var(--ease-1), color .2s var(--ease-1), border-color .2s var(--ease-1), transform .2s var(--ease-1); }
.chip:hover, .tab:hover { transform: translateY(-1px); }

/* Route fade/scale transition */
.fade-scale-enter-active, .fade-scale-leave-active { transition: opacity .25s var(--ease-1), transform .25s var(--ease-1); }
.fade-scale-enter-from, .fade-scale-leave-to { opacity: 0; transform: translateY(6px) scale(.98); }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
</style>
