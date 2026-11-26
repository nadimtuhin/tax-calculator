// Pure helpers for the blog pages. No DOM access: they run in the build-time prerender too.

export const WORDS_PER_MINUTE = 200

export const SOURCES_ID = 'sources-heading'
// Ids already used on a guide page (app shell, sources, related, TOC rail); section anchors must avoid them.
export const GUIDE_PAGE_IDS = ['app', 'tax-app', 'main-content', SOURCES_ID, 'related-heading', 'toc-rail-title']

const countWords = (text) =>
  text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length

export function readingMinutes(post) {
  const words = post.sections.reduce(
    (total, section) =>
      total + countWords(section.heading) + section.content.reduce((sum, paragraph) => sum + countWords(paragraph), 0),
    0
  )
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

export const readingTimeLabel = (post) => `${readingMinutes(post)} min read`

export function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function sectionAnchors(post, reserved = []) {
  const used = new Set(reserved)
  return post.sections.map((section) => {
    const base = slugify(section.heading) || 'section'
    let id = base
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return { id, heading: section.heading }
  })
}

export const relatedGuides = (posts, currentSlug) => posts.filter((post) => post.slug !== currentSlug)

// "• text" and "1. text" lines keep their exact text; the marker is split off only for a hanging indent.
export function splitListMarker(paragraph) {
  const match = paragraph.match(/^(•|\d+\.)\s+/)
  return match ? { marker: match[0], body: paragraph.slice(match[0].length) } : { marker: null, body: paragraph }
}
