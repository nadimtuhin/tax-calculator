// Build-time only: rendered by scripts/prerender.mjs, never shipped to the browser.
import { createSSRApp, h } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import Navbar from './components/Navbar.vue'
import Blog from './pages/Blog.vue'
import BlogPost from './pages/BlogPost.vue'
import Referrals from './pages/Referrals.vue'
import { BLOG_POSTS } from './data/blogPosts'
import { CANONICAL_ORIGIN, ROUTE_META, blogPostMeta } from './router/meta'

export { BLOG_POSTS, CANONICAL_ORIGIN }

export const PRERENDER_ROUTES = [
  { path: '/blog', meta: ROUTE_META.Blog },
  ...BLOG_POSTS.map((post) => ({ path: `/blog/${post.slug}`, meta: blogPostMeta(post) })),
  { path: '/referrals', meta: ROUTE_META.Referrals }
]

// Mirrors App.vue's shell without the store-backed calculator, toasts and modal.
const Shell = {
  render: () => h('div', { id: 'tax-app' }, [
    h(Navbar),
    h('main', { id: 'main-content', tabindex: '-1' }, [h(RouterView)])
  ])
}

export async function render(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/blog', component: Blog },
      { path: '/blog/:slug', component: BlogPost, props: true },
      { path: '/referrals', component: Referrals }
    ]
  })
  const app = createSSRApp(Shell).use(router)
  await router.push(path)
  await router.isReady()
  return renderToString(app)
}
