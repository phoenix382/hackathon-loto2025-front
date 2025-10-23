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
      <router-view />
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
.nav-link:hover, .nav-link.router-link-active { color: #007bff; background-color: #f8f9fa; }

.main-content { min-height: calc(100vh - 60px); padding: 2rem 0; }
</style>

