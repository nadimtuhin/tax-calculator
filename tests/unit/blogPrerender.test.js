// @vitest-environment node
// The build-time prerender has no document or window; the guide extras must still render.
import { render } from '@/entry-server'
import { BLOG_POSTS } from '@/data/blogPosts'
import { GUIDE_PAGE_IDS, readingTimeLabel, sectionAnchors } from '@/lib/blogGuide'

describe('prerendered blog HTML (no DOM)', () => {
  test('/blog renders the guide count and each card reading time', async () => {
    const html = await render('/blog')
    expect(html).toContain(`${BLOG_POSTS.length} guides`)
    BLOG_POSTS.forEach((post) => {
      expect(html).toContain(`href="/blog/${post.slug}"`)
      expect(html).toContain(readingTimeLabel(post))
    })
  })

  test.each(BLOG_POSTS.map((p) => [p.slug, p]))('/blog/%s renders TOC, heading ids, reading time and related guides', async (slug, post) => {
    const html = await render(`/blog/${slug}`)
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('In this guide')
    expect(html).toContain(readingTimeLabel(post))
    sectionAnchors(post, GUIDE_PAGE_IDS).forEach(({ id }) => {
      expect(html).toContain(`id="${id}"`)
      expect(html).toContain(`href="#${id}"`)
    })
    const related = html.slice(html.indexOf('Related guides'))
    expect(related.length).toBeLessThan(html.length)
    BLOG_POSTS.filter((p) => p.slug !== slug).forEach((other) => {
      expect(related).toContain(`href="/blog/${other.slug}"`)
    })
    expect(related).not.toContain(`href="/blog/${slug}"`)
  })
})
