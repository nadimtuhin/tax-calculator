import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import { CANONICAL_ORIGIN, ROUTE_META } from './meta'

const Blog = () => import('@/pages/Blog.vue')
const BlogPost = () => import('@/pages/BlogPost.vue')
const Referrals = () => import('@/pages/Referrals.vue')

const routes = [
  { path: '/', name: 'Home', component: Home, meta: ROUTE_META.Home },
  { path: '/blog', name: 'Blog', component: Blog, meta: ROUTE_META.Blog },
  { path: '/blog/:slug', name: 'BlogPost', component: BlogPost, props: true, meta: ROUTE_META.BlogPost },
  { path: '/referrals', name: 'Referrals', component: Referrals, meta: ROUTE_META.Referrals },
  // Back-compat: anything else goes home.
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

const setMeta = (name, content, attribute = 'name') => {
  let el = document.querySelector(`meta[${attribute}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Per-route <title> + meta description + canonical URL for SEO.

router.afterEach((to) => {
  const { title, description } = to.meta || {}
  const routeUrl = `${CANONICAL_ORIGIN}${to.path}`
  if (title) {
    document.title = title
    setMeta('og:title', title, 'property')
  }
  if (description) {
    setMeta('description', description)
    setMeta('og:description', description, 'property')
  }
  setMeta('og:url', routeUrl, 'property')

  const canonical =
    document.querySelector('link[rel="canonical"]') ||
    (() => {
      const link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
      return link
    })()
  canonical.setAttribute('href', routeUrl)
})

export default router
