// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// Импортируем компоненты страниц
const DrawPage = () => import('@/pages/DrawPage.vue')
const VerifyPage = () => import('@/pages/VerifyPage.vue')
const PassportPage = () => import('@/pages/PassportPage.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/draw',
  },
  {
    path: '/draw',
    name: 'Draw',
    component: DrawPage,
  },
  {
    path: '/verify',
    name: 'Verify',
    component: VerifyPage,
  },
  {
    path: '/passport',
    name: 'Passport',
    component: PassportPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
