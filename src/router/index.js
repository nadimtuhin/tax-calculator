import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import Blog from '@/pages/Blog.vue'
import BlogPost from '@/pages/BlogPost.vue'
import Referrals from '@/pages/Referrals.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Bangladesh Tax calculator — FY 2025-26 & FY 2026-27 (BDT ৳)',
      description:
        'Calculate salaried income tax in Bangladesh for FY 2025-26 and FY 2026-27 (Finance Act 2026). Instant BDT (৳) slab breakdown, salary exemptions, monthly TDS, and Section 78 investment rebate.'
    }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog,
    meta: {
      title: 'Blog — Bangladesh Personal Income Tax Guides | BD Tax Calculator',
      description:
        'Plain-language guides to Bangladesh personal income tax: fiscal year vs assessment year, salary exemptions, Section 78 rebate, and how to prepare for filing your return.'
    }
  },
  {
    path: '/blog/:slug',
    name: 'BlogPost',
    component: BlogPost,
    meta: {
      // Title/description are set per-article inside BlogPost.
      title: 'Blog — Bangladesh Personal Income Tax Guides | BD Tax Calculator',
      description:
        'Plain-language guide to Bangladesh personal income tax from BD Tax Calculator. General information only — not tax advice.'
    }
  },
  {
    path: '/referrals',
    name: 'Referrals',
    component: Referrals,
    meta: {
      title: 'Lawyer Referral Service | BD Tax Calculator',
      description:
        'Request an introduction to an independent Bangladesh tax lawyer through Nadim\u2019s referral/intermediary service. Not a law firm; no legal advice.'
    }
  },
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
// Canonical host follows the existing og:url in public/index.html (tax.nadimtuhin.com).
const CANONICAL_ORIGIN = 'https://tax.nadimtuhin.com'

router.afterEach((to) => {
  const { title, description } = to.meta || {}
  const routeUrl = `${CANONICAL_ORIGIN}${to.fullPath === '/' ? '/' : to.path}`
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
