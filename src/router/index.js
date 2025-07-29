import { createRouter, createWebHistory } from 'vue-router'
import Historical2023 from '@/pages/Historical-2023.vue'
import Home from '@/pages/Home.vue'
import TaxGuide from '@/pages/TaxGuide.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/historical-2023',
    name: 'Historical2023',
    component: Historical2023
  },
  {
    path: '/tax-guide',
    name: 'TaxGuide',
    component: TaxGuide
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

export default router
