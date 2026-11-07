import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Blog from '@/pages/Blog.vue'
import BlogPost from '@/pages/BlogPost.vue'
import Referrals from '@/pages/Referrals.vue'
import { BLOG_POSTS, getBlogPost } from '@/data/blogPosts'

describe('Blog and Statutory Guides', () => {
  test('all blog posts have required statutory fields, citations, and non-empty content', () => {
    expect(BLOG_POSTS.length).toBeGreaterThanOrEqual(3)

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

  test('getBlogPost returns correct post by slug', () => {
    const post = getBlogPost('fiscal-year-vs-assessment-year-bangladesh')
    expect(post).toBeDefined()
    expect(post.title).toContain('Fiscal Year vs Assessment Year')

    const invalid = getBlogPost('non-existent-article-slug')
    expect(invalid).toBeUndefined()
  })

  test('Blog.vue renders list of articles with links and legal disclaimer', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/blog', component: Blog },
        { path: '/blog/:slug', component: BlogPost }
      ]
    })

    const wrapper = mount(Blog, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.text()).toContain('Income Tax Guides')
    expect(wrapper.text()).toContain('Not formal tax advice')

    const articles = wrapper.findAll('article.post-card')
    expect(articles.length).toBe(BLOG_POSTS.length)
  })

  test('BlogPost.vue renders article content and official citations', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/blog/:slug', component: BlogPost }
      ]
    })

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
  })

  test('BlogPost.vue shows not found message on invalid slug', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/blog/:slug', component: BlogPost }
      ]
    })

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
  test('Referrals page renders disclosure and disabled submission state', () => {
    const wrapper = mount(Referrals)

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
  })
})
