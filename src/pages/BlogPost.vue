<template>
  <div v-if="post" class="article-page">
    <div class="article-layout">
      <nav class="toc-rail" aria-labelledby="toc-rail-title">
        <p id="toc-rail-title" class="toc-title">In this guide</p>
        <ol class="toc-list">
          <li v-for="item in tocItems" :key="item.id">
            <a
              :href="`#${item.id}`"
              class="toc-link"
              :aria-current="activeId === item.id ? 'true' : null"
              @click="goToSection($event, item.id)"
            >{{ item.heading }}</a>
          </li>
        </ol>
      </nav>

      <div class="article-main">
        <article class="article-container">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <router-link to="/blog">Tax Guides</router-link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ post.title }}</span>
          </nav>

          <header class="article-header">
            <h1>{{ post.title }}</h1>
            <p class="article-lead">{{ post.excerpt }}</p>
            <p class="article-meta">
              <span>{{ readingTime }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ post.sections.length }} sections</span>
            </p>
          </header>

          <aside class="disclaimer-banner" role="note">
            <svg class="callout-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
            <p><strong>Not tax advice:</strong> This article is educational information only. Verify current law and deadlines through official NBR publications or a qualified professional.</p>
          </aside>

          <details class="toc-inline">
            <summary>In this guide</summary>
            <nav aria-label="In this guide">
              <ol class="toc-list">
                <li v-for="item in tocItems" :key="item.id">
                  <a :href="`#${item.id}`" class="toc-link" @click="goToSection($event, item.id)">{{ item.heading }}</a>
                </li>
              </ol>
            </nav>
          </details>

          <div class="article-body">
            <section v-for="(section, sIndex) in post.sections" :key="section.heading" class="article-section">
              <h2 :id="anchors[sIndex].id" tabindex="-1">{{ section.heading }}</h2>
              <p
                v-for="(paragraph, index) in section.content"
                :key="index"
                :class="{ 'list-line': listMarker(paragraph) }"
              >
                <span v-if="listMarker(paragraph)" class="list-marker">{{ listMarker(paragraph) }}</span>
                <span class="paragraph-body">
                  <template v-for="(token, tIndex) in formatTokens(listBody(paragraph))" :key="tIndex">
                    <strong v-if="token.type === 'bold'">{{ token.value }}</strong>
                    <span v-else>{{ token.value }}</span>
                  </template>
                </span>
              </p>
            </section>
          </div>

          <section class="sources-section" aria-labelledby="sources-heading">
            <h2 :id="SOURCES_ID" tabindex="-1">Official Sources</h2>
            <p>Statutory references and sources supporting this guide:</p>
            <ul>
              <li v-for="source in post.citations" :key="source">
                <span class="citation-text">{{ citationText(source) }} </span>
                <a :href="sourceUrl(source)" target="_blank" rel="noopener noreferrer" class="citation-link">
                  Official NBR Source<span class="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
            <p class="source-caution">Sources are cited for reference only. Always check current legislation and official circulars before making tax decisions.</p>
          </section>

          <!-- Calculator Callout -->
          <section class="calculator-callout" aria-label="Interactive Tax Calculator">
            <div class="callout-text">
              <strong>Ready to calculate your tax or rebate?</strong>
              <p>Run instant calculations for FY 2025–26 and FY 2026–27 using our interactive tool.</p>
            </div>
            <router-link to="/" class="callout-btn">
              Open Tax Calculator <span aria-hidden="true">→</span>
            </router-link>
          </section>

          <footer class="article-footer">
            <router-link to="/blog" class="back-link">← Back to Tax Guides</router-link>
            <router-link to="/" class="back-link">Go to Calculator →</router-link>
          </footer>
        </article>

        <section v-if="related.length" class="related-section" aria-labelledby="related-heading">
          <h2 id="related-heading">Related guides</h2>
          <ul class="related-list">
            <li v-for="item in related" :key="item.slug" class="related-item">
              <h3 class="related-title">
                <router-link :to="`/blog/${item.slug}`" class="related-link">{{ item.title }}</router-link>
              </h3>
              <p class="related-excerpt">{{ item.excerpt }}</p>
              <p class="related-meta">{{ item.readingTime }}</p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h1>Guide Not Found</h1>
    <p>This guide does not exist.</p>
    <router-link to="/blog">Browse all tax guides →</router-link>
  </div>
</template>

<script>
import { BLOG_POSTS, getBlogPost } from '@/data/blogPosts'
import { blogPostMeta } from '@/router/meta'
import { readingTimeLabel, relatedGuides, sectionAnchors, splitListMarker } from '@/lib/blogGuide'

const SOURCES_ID = 'sources-heading'

export default {
  name: 'BlogPost',
  props: {
    slug: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      SOURCES_ID,
      activeId: null
    }
  },
  computed: {
    post() {
      return getBlogPost(this.slug || this.$route.params.slug)
    },
    anchors() {
      return sectionAnchors(this.post, [SOURCES_ID, 'related-heading', 'toc-rail-title'])
    },
    tocItems() {
      return [...this.anchors, { id: SOURCES_ID, heading: 'Official Sources' }]
    },
    readingTime() {
      return readingTimeLabel(this.post)
    },
    related() {
      return relatedGuides(BLOG_POSTS, this.post.slug).map((item) => ({ ...item, readingTime: readingTimeLabel(item) }))
    }
  },
  watch: {
    post: {
      immediate: true,
      handler(post) {
        // No document during the build-time prerender; it writes the head itself.
        if (post && typeof document !== 'undefined') {
          const { title, description } = blogPostMeta(post)
          document.title = title
          const descriptionEl = document.querySelector('meta[name="description"]')
          if (descriptionEl) descriptionEl.content = description
          const ogTitle = document.querySelector('meta[property="og:title"]')
          if (ogTitle) ogTitle.content = title
          const ogDesc = document.querySelector('meta[property="og:description"]')
          if (ogDesc) ogDesc.content = description
        }
      }
    },
    slug(newSlug, oldSlug) {
      // A related-guide link reuses this component; start the new guide at the top.
      if (newSlug === oldSlug || typeof window === 'undefined') return
      window.scrollTo({ top: 0 })
      this.activeId = null
      this.$nextTick(this.observeHeadings)
    }
  },
  mounted() {
    this.observeHeadings()
  },
  beforeUnmount() {
    if (this.observer) this.observer.disconnect()
  },
  methods: {
    observeHeadings() {
      if (this.observer) this.observer.disconnect()
      if (!this.post || typeof IntersectionObserver === 'undefined') return
      // Highlight the heading nearest the top of the viewport, below the sticky navbar.
      this.observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting)
          if (visible.length) {
            visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
            this.activeId = visible[0].target.id
          }
        },
        { rootMargin: '-80px 0px -60% 0px' }
      )
      this.tocItems.forEach(({ id }) => {
        const heading = document.getElementById(id)
        if (heading) this.observer.observe(heading)
      })
    },
    goToSection(event, id) {
      const heading = document.getElementById(id)
      if (!heading) return
      event.preventDefault()
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      heading.focus({ preventScroll: true })
      this.$router.replace({ hash: `#${id}` }).catch(() => {})
      this.activeId = id
    },
    listMarker(paragraph) {
      return splitListMarker(paragraph).marker
    },
    listBody(paragraph) {
      return splitListMarker(paragraph).body
    },
    sourceUrl(citation) {
      // Citations end with the official URL; return it or nothing.
      const match = citation.match(/https:\/\/\S+$/)
      return match ? match[0] : undefined
    },
    citationText(citation) {
      return citation.replace(/\s*https:\/\/\S+$/, '')
    },
    formatTokens(text) {
      const tokens = []
      const regex = /\*\*(.*?)\*\*/g
      let lastIndex = 0
      let match
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          tokens.push({ type: 'text', value: text.substring(lastIndex, match.index) })
        }
        tokens.push({ type: 'bold', value: match[1] })
        lastIndex = regex.lastIndex
      }
      if (lastIndex < text.length) {
        tokens.push({ type: 'text', value: text.substring(lastIndex) })
      }
      return tokens
    }
  }
}
</script>

<style scoped>
.article-page {
  min-height: calc(100vh - 64px);
  padding: var(--space-5) var(--space-4) calc(var(--space-6) * 2);
  background: var(--bg);
}

.article-layout {
  max-width: 760px;
  margin: 0 auto;
}

.article-main {
  min-width: 0;
}

.article-container {
  padding: var(--space-6) clamp(var(--space-4), 5vw, 48px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

/* Table of contents: a sticky rail on desktop, a collapsed list inside the article below that. */
.toc-rail {
  display: none;
}

@media (min-width: 1024px) {
  .article-layout {
    max-width: 1040px;
    display: grid;
    grid-template-columns: 220px minmax(0, 760px);
    gap: 40px;
    align-items: start;
    justify-content: center;
  }

  .toc-rail {
    display: block;
    position: sticky;
    top: 84px;
    max-height: calc(100vh - 108px);
    overflow-y: auto;
    padding-top: var(--space-6);
  }

  .toc-inline {
    display: none;
  }
}

.toc-title {
  margin-bottom: var(--space-2);
  padding-left: var(--space-3);
  color: var(--text);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-link {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 6px var(--space-3);
  border-left: 2px solid var(--border);
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.35;
  text-decoration: none;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s;
}

.toc-link:hover {
  color: var(--text);
  border-left-color: var(--border-strong);
}

.toc-link[aria-current="true"] {
  border-left-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 650;
}

.toc-inline {
  margin-bottom: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
}

.toc-inline summary {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-4);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--text);
}

.toc-inline summary::-webkit-details-marker { display: none; }
.toc-inline summary { list-style: none; }

.toc-inline summary::after {
  content: "";
  width: 8px;
  height: 8px;
  margin-left: auto;
  border-right: 2px solid var(--text-muted);
  border-bottom: 2px solid var(--text-muted);
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.15s;
}

.toc-inline[open] summary::after {
  transform: translateY(2px) rotate(-135deg);
}

.toc-inline[open] summary {
  border-bottom: 1px solid var(--border);
}

.toc-inline .toc-list {
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
}

.breadcrumb {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
  margin-bottom: var(--space-5);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.breadcrumb a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  flex-shrink: 0;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.article-header { margin-bottom: var(--space-5); }
.article-header h1 {
  margin-bottom: var(--space-3);
  color: var(--text);
  font-size: clamp(1.875rem, 4.5vw, 2.625rem);
  font-weight: 750;
  line-height: 1.12;
  letter-spacing: -0.03em;
}
.article-lead {
  max-width: 62ch;
  margin-bottom: var(--space-4);
  color: var(--text-muted);
  font-size: var(--text-lg);
  line-height: 1.55;
}
.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-3) 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

/* Callouts */
.disclaimer-banner,
.calculator-callout {
  display: flex;
  gap: var(--space-3);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
}

.disclaimer-banner {
  align-items: flex-start;
  margin-bottom: var(--space-5);
  background: var(--warn-soft);
  border: 1px solid var(--border);
  border-left: 3px solid var(--warn);
}

.disclaimer-banner p {
  margin: 0;
  color: var(--text);
  font-size: var(--text-sm);
  line-height: 1.55;
}

.callout-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--warn);
}

/* Reading column */
.article-body {
  font-size: 1.0625rem;
}

.article-section,
.sources-section {
  max-width: 68ch;
}

.article-section + .article-section { margin-top: 2.25rem; }

.article-section h2,
.sources-section h2 {
  margin-bottom: var(--space-3);
  font-size: var(--text-xl);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.015em;
  scroll-margin-top: 84px;
}

.article-section p {
  margin-bottom: var(--space-4);
  line-height: 1.7;
}

.article-section p:last-child { margin-bottom: 0; }
.article-section p :deep(strong) { font-weight: 650; }
.article-section p :deep(em) { font-style: italic; }

/* "• " and "1. " lines from the data: same text, hanging marker. */
.article-section .list-line {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  padding-left: var(--space-1);
}

.article-section .list-line + p:not(.list-line) { margin-top: var(--space-4); }

.list-marker {
  flex: 0 0 1.25em;
  color: var(--accent);
  font-weight: 700;
}

.paragraph-body { min-width: 0; }

.sources-section {
  margin-top: 2.5rem;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}
.sources-section p { margin-bottom: var(--space-3); color: var(--text-muted); }
.sources-section ul { padding-left: 1.5rem; }
.sources-section li { margin-bottom: var(--space-2); line-height: 1.6; overflow-wrap: anywhere; }
.sources-section a { color: var(--accent); }
.citation-link {
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.source-caution { margin-top: var(--space-3); font-size: var(--text-sm); }

.calculator-callout {
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-6);
  background: var(--accent-soft);
}

.callout-text strong {
  display: block;
  font-size: var(--text-base);
  color: var(--accent);
  margin-bottom: 2px;
}

.callout-text p {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

.callout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 44px;
  padding: 0 var(--space-4);
  background: var(--accent);
  color: var(--on-accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.callout-btn:hover,
.callout-btn:focus-visible {
  background: var(--accent-hover);
  color: var(--on-accent);
}

.article-footer {
  padding-top: var(--space-5);
  margin-top: var(--space-5);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
.back-link:hover { text-decoration: underline; }

/* Related guides: hairline rows, the title link covers the row. */
.related-section {
  margin-top: var(--space-6);
}

.related-section h2 {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-strong);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.015em;
}

.related-list {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: var(--space-6);
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (min-width: 640px) {
  .related-list { grid-template-columns: repeat(2, 1fr); }
}

.related-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) 0;
  border-bottom: 1px solid var(--border);
}

.related-title {
  font-size: var(--text-base);
  font-weight: 650;
  line-height: 1.4;
}

.related-link {
  color: var(--text);
  text-decoration: none;
}

.related-link::after {
  content: "";
  position: absolute;
  inset: 0;
}

.related-item:hover .related-link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.related-link:focus-visible {
  outline-offset: 4px;
}

.related-excerpt {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.55;
}

.related-meta {
  margin: var(--space-1) 0 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: 600;
}

.not-found { max-width: 760px; margin: var(--space-6) auto; padding: var(--space-5); }
.not-found p { margin: var(--space-3) 0; }
.not-found a { color: var(--accent); }

@media (max-width: 600px) {
  .article-page { padding-left: var(--space-3); padding-right: var(--space-3); }
  .article-container { padding: var(--space-5) var(--space-4); }
  .calculator-callout { flex-direction: column; align-items: stretch; }
}

@media (prefers-reduced-motion: reduce) {
  .toc-link { transition: none; }
}
</style>
