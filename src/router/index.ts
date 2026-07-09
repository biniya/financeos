import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/plan' },
    { path: '/plan', name: 'plan', component: () => import('@/views/PlanView.vue') },
    { path: '/expenses', name: 'expenses', component: () => import('@/views/ExpensesView.vue') },
  ],
})

export default router
