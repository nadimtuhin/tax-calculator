import Vue from 'vue'
import VueRouter from 'vue-router'
import Historical2023 from '../pages/Historical-2023.vue'
import Home from '@/pages/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/tax-2023',
    name: 'Historical2023',
    component: Historical2023
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes
})

export default router
