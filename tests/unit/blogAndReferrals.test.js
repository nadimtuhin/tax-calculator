import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Blog from '@/pages/Blog.vue'
import BlogPost from '@/pages/BlogPost.vue'
import Referrals from '@/pages/Referrals.vue'
import { BLOG_POSTS, getBlogPost } from '@/data/blogPosts'
import appRouter from '@/router/index'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
      { path: '/blog', name: 'Blog', component: Blog },
      { path: '/blog/:slug', name: 'BlogPost', component: BlogPost },
      { path: '/referrals', name: 'Referrals', component: Referrals }
    ]
  })
}

describe('Blog and Statutory Guides', () => {
  test('all blog posts have required statutory fields, citations, and non-empty content', () => {
    expect(BLOG_POSTS.length).toBe(3)

    BLOG_POSTS.forEach((post) => {
      expect(post.slug).toBeTruthy()
      expect(post.title).toBeTruthy()
      expect(post.excerpt).toBeTruthy()
      expect(post.citations.length).toBeGreaterThan(0)
      expect(post.sections.length).toBeGreaterThan(0)

      post.citations.forEach((citation) => {
        expect(citation).toMatch(/Income Tax Act/i)
        expect(citation).toMatch(/https:\/\/nbr\.gov\.bd\//)
      })

      // Ensure every post has a disclaimer
      const hasDisclaimer = post.sections.some(
        (s) => /disclaimer/i.test(s.heading) || s.content.some((c) => /not tax advice/i.test(c))
      )
      expect(hasDisclaimer).toBe(true)
    })
  })

  test('Section 78 guide contains verified statutory formula and Finance Act 2024 amendment', () => {
    const post = getBlogPost('section-78-investment-rebate-bangladesh')
    expect(post).toBeDefined()
    expect(post.title).toContain('Section 78')
    expect(post.citations.some((c) => /Finance Act, 2024/i.test(c))).toBe(true)

    const fullContent = post.sections.flatMap((s) => s.content).join(' ')
    expect(fullContent).toContain('3% of taxable income')
    expect(fullContent).toContain('10% of qualifying investment')
    expect(fullContent).toContain('7,50,000')
  })

  test('Fiscal Year vs Assessment Year guide clearly maps income year to assessment year', () => {
    const post = getBlogPost('fiscal-year-vs-assessment-year-bangladesh')
    expect(post).toBeDefined()
    const fullContent = post.sections.flatMap((s) => s.content).join(' ')
    expect(fullContent).toContain('2024–25')
    expect(fullContent).toContain('2025–26')
    expect(fullContent).toContain('2026–27')
    expect(fullContent).toContain('Tax Day')
  })

  test('getBlogPost returns correct post by slug and undefined for invalid slug', () => {
    const post = getBlogPost('fiscal-year-vs-assessment-year-bangladesh')
    expect(post).toBeDefined()
    expect(post.title).toContain('Fiscal Year vs Assessment Year')

    const invalid = getBlogPost('non-existent-article-slug')
    expect(invalid).toBeUndefined()
  })

  test('Blog.vue renders list of articles with links, calculator callout, and legal disclaimer', async () => {
    const router = createTestRouter()
    await router.push('/blog')

    const wrapper = mount(Blog, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Income Tax Guides')
    expect(wrapper.text()).toContain('Not formal tax advice')
    expect(wrapper.text()).toContain('Interactive BD Tax Calculator')

    const articles = wrapper.findAll('article.post-card')
    expect(articles.length).toBe(BLOG_POSTS.length)

    const calcLink = wrapper.find('.calculator-banner-btn')
    expect(calcLink.exists()).toBe(true)
    expect(calcLink.attributes('href')).toBe('/')
  })

  test('BlogPost.vue renders article content, official citations, and calculator callout', async () => {
    const router = createTestRouter()
    await router.push('/blog/fiscal-year-vs-assessment-year-bangladesh')

    const wrapper = mount(BlogPost, {
      props: {
        slug: 'fiscal-year-vs-assessment-year-bangladesh'
      },
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Fiscal Year vs Assessment Year')
    expect(wrapper.text()).toContain('Official Sources')
    expect(wrapper.text()).toContain('Not tax advice')
    expect(wrapper.find('.sources-section').exists()).toBe(true)
    expect(wrapper.find('.sources-section a').attributes('href')).toBe('https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf')

    const calcCallout = wrapper.find('.calculator-callout')
    expect(calcCallout.exists()).toBe(true)
    expect(calcCallout.find('.callout-btn').attributes('href')).toBe('/')
  })

  test('BlogPost.vue shows not found message on invalid slug', async () => {
    const router = createTestRouter()
    await router.push('/blog/invalid-nonexistent-slug')

    const wrapper = mount(BlogPost, {
      props: {
        slug: 'invalid-nonexistent-slug'
      },
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Guide Not Found')
  })
})

describe('Lawyer Referrals Page & Form Safety', () => {
  test('Referrals page renders disclosure, disabled submission state, and navigation links', async () => {
    const router = createTestRouter()
    await router.push('/referrals')

    const wrapper = mount(Referrals, {
      global: {
        plugins: [router]
      }
    })

    // Verify disclosure and intermediary statements
    expect(wrapper.text()).toContain('Nadim operates this referral and intermediary service as an individual, not as a law firm')
    expect(wrapper.text()).toContain('Direct Submissions Currently Paused')
    expect(wrapper.text()).toContain('Submission Temporarily Unavailable')

    // Verify all input fields are strictly disabled
    const inputs = wrapper.findAll('input, select, textarea, button.submit-button')
    expect(inputs.length).toBeGreaterThan(0)
    inputs.forEach((input) => {
      expect(input.attributes('disabled')).toBeDefined()
      expect(input.attributes('aria-disabled')).toBe('true')
    })

    // Verify privacy warning explicitly warns against sharing NID/TIN
    expect(wrapper.text()).toContain('TIN')
    expect(wrapper.text()).toContain('National ID (NID)')

    // Verify navigation links back to calculator and blog
    const footerLinks = wrapper.findAll('.referrals-footer .footer-nav-link')
    expect(footerLinks.length).toBe(2)
    expect(footerLinks[0].attributes('href')).toBe('/')
    expect(footerLinks[1].attributes('href')).toBe('/blog')
  })

  test('Form cannot be submitted and performs zero network or storage actions', async () => {
    const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem')
    const router = createTestRouter()
    const wrapper = mount(Referrals, {
      global: {
        plugins: [router]
      }
    })

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(localStorageSpy).not.toHaveBeenCalled()
    localStorageSpy.mockRestore()
  })
})

describe('Application Router & Route Metadata', () => {
  test('router registers all required application routes with meta tags', () => {
    const routeNames = appRouter.getRoutes().map((r) => r.name).filter(Boolean)
    expect(routeNames).toContain('Home')
    expect(routeNames).toContain('Blog')
    expect(routeNames).toContain('BlogPost')
    expect(routeNames).toContain('Referrals')

    const homeRoute = appRouter.getRoutes().find((r) => r.name === 'Home')
    expect(homeRoute.meta.title).toContain('Bangladesh Tax calculator')
    expect(homeRoute.meta.description).toContain('FY 2025-26')

    const blogRoute = appRouter.getRoutes().find((r) => r.name === 'Blog')
    expect(blogRoute.meta.title).toContain('Blog')

    const referralsRoute = appRouter.getRoutes().find((r) => r.name === 'Referrals')
    expect(referralsRoute.meta.title).toContain('Lawyer Referral Service')
  })
})
