import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Blog from '@/pages/Blog.vue'
import BlogPost from '@/pages/BlogPost.vue'
import { BLOG_POSTS } from '@/data/blogPosts'
import {
  readingMinutes,
  readingTimeLabel,
  relatedGuides,
  sectionAnchors,
  slugify,
  splitListMarker
} from '@/lib/blogGuide'

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ')

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/blog', component: Blog },
      { path: '/blog/:slug', component: BlogPost, props: true }
    ]
  })
}

describe('readingMinutes', () => {
  test('counts heading and paragraph words at 200 wpm, rounded up', () => {
    const post = (headingWords, paragraphWords) => ({
      sections: [{ heading: words(headingWords), content: [words(paragraphWords)] }]
    })
    expect(readingMinutes(post(0, 200))).toBe(1)
    expect(readingMinutes(post(1, 200))).toBe(2)
    expect(readingMinutes(post(100, 300))).toBe(2)
    expect(readingMinutes(post(100, 301))).toBe(3)
  })

  test('ignores bare bullet markers and ** markup', () => {
    const justUnder = { sections: [{ heading: '', content: [words(199), '• **one** • **'] }] }
    const justOver = { sections: [{ heading: '', content: [words(199), '• **one** two'] }] }
    expect(readingMinutes(justUnder)).toBe(1)
    expect(readingMinutes(justOver)).toBe(2)
  })

  test('every guide gets an "N min read" label from its own text', () => {
    BLOG_POSTS.forEach((post) => {
      const total = post.sections
        .flatMap((s) => [s.heading, ...s.content])
        .join(' ')
        .split(/\s+/)
        .filter((t) => /[\p{L}\p{N}]/u.test(t)).length
      expect(readingTimeLabel(post)).toBe(`${Math.ceil(total / 200)} min read`)
    })
  })
})

describe('section anchors', () => {
  test('slugify keeps letters and digits only', () => {
    expect(slugify('Statement of assets and liabilities (Section 167)')).toBe('statement-of-assets-and-liabilities-section-167')
    expect(slugify('Concrete mapping: FY vs AY')).toBe('concrete-mapping-fy-vs-ay')
    expect(slugify('  —  ')).toBe('')
  })

  test('ids are unique, including repeated headings and reserved ids', () => {
    const post = { sections: [{ heading: 'Notes' }, { heading: 'Notes' }, { heading: 'Sources heading' }, { heading: '***' }] }
    const ids = sectionAnchors(post, ['sources-heading']).map((a) => a.id)
    expect(ids).toEqual(['notes', 'notes-2', 'sources-heading-2', 'section'])
  })

  test('every guide has unique, non-empty section ids', () => {
    BLOG_POSTS.forEach((post) => {
      const ids = sectionAnchors(post, ['sources-heading']).map((a) => a.id)
      expect(ids.every(Boolean)).toBe(true)
      expect(new Set(ids).size).toBe(post.sections.length)
      expect(ids).not.toContain('sources-heading')
    })
  })
})

describe('relatedGuides', () => {
  test('excludes the current guide and keeps the others in order', () => {
    const [a, b, c] = BLOG_POSTS
    expect(relatedGuides(BLOG_POSTS, b.slug).map((p) => p.slug)).toEqual([a.slug, c.slug])
    expect(relatedGuides(BLOG_POSTS, 'missing')).toHaveLength(BLOG_POSTS.length)
  })
})

describe('splitListMarker', () => {
  test('splits "• " and "1. " markers without changing the text', () => {
    const all = BLOG_POSTS.flatMap((p) => p.sections.flatMap((s) => s.content))
    all.forEach((paragraph) => {
      const { marker, body } = splitListMarker(paragraph)
      expect((marker || '') + body).toBe(paragraph)
    })
    expect(splitListMarker('• **Bank:** x').marker).toBe('• ')
    expect(splitListMarker('2. **10%:** y').marker).toBe('2. ')
    expect(splitListMarker('The 3% rule').marker).toBeNull()
  })
})

describe('Blog index cards', () => {
  test('shows a guide count and one accessible link per card with its reading time', async () => {
    const router = createTestRouter()
    await router.push('/blog')
    const wrapper = mount(Blog, { global: { plugins: [router] } })

    expect(wrapper.find('.guides-count').text()).toBe(`${BLOG_POSTS.length} guides`)
    const cards = wrapper.findAll('article.post-card')
    cards.forEach((card, i) => {
      const links = card.findAll('a')
      expect(links).toHaveLength(1)
      expect(links[0].attributes('href')).toBe(`/blog/${BLOG_POSTS[i].slug}`)
      expect(links[0].attributes('aria-label')).toBe(`Read Guide: ${BLOG_POSTS[i].title}`)
      expect(card.find('.post-meta').text()).toBe(readingTimeLabel(BLOG_POSTS[i]))
    })
  })
})

describe('Guide page', () => {
  const post = BLOG_POSTS[1]

  async function mountGuide() {
    const router = createTestRouter()
    await router.push(`/blog/${post.slug}`)
    return mount(BlogPost, { props: { slug: post.slug }, global: { plugins: [router] } })
  }

  test('table of contents links point at the section headings', async () => {
    const wrapper = await mountGuide()
    const headingIds = wrapper.findAll('.article-section h2').map((h) => h.attributes('id'))
    expect(headingIds).toHaveLength(post.sections.length)

    const railHrefs = wrapper.findAll('.toc-rail .toc-link').map((a) => a.attributes('href'))
    expect(railHrefs).toEqual([...headingIds, 'sources-heading'].map((id) => `#${id}`))
    const inlineHrefs = wrapper.findAll('.toc-inline .toc-link').map((a) => a.attributes('href'))
    expect(inlineHrefs).toEqual(railHrefs)
    expect(wrapper.find('#sources-heading').exists()).toBe(true)
  })

  test('header shows the deck and reading time; related guides exclude the current one', async () => {
    const wrapper = await mountGuide()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.find('.article-lead').text()).toBe(post.excerpt)
    expect(wrapper.find('.article-meta').text()).toContain(readingTimeLabel(post))

    const relatedHrefs = wrapper.findAll('.related-link').map((a) => a.attributes('href'))
    expect(relatedHrefs).toEqual(BLOG_POSTS.filter((p) => p.slug !== post.slug).map((p) => `/blog/${p.slug}`))
  })

  test('paragraph text, including bullet lines, renders unchanged apart from ** markup', async () => {
    const wrapper = await mountGuide()
    const rendered = wrapper.findAll('.article-section p').map((p) => p.element.textContent)
    const expected = post.sections.flatMap((s) => s.content).map((c) => c.replace(/\*\*/g, ''))
    expect(rendered).toEqual(expected)
  })
})
