<template>
  <div v-if="post" class="article-page">
    <article class="article-container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/blog">Tax Guides</router-link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ post.title }}</span>
      </nav>

      <header class="article-header">
        <h1>{{ post.title }}</h1>
        <p class="article-lead">{{ post.excerpt }}</p>
      </header>

      <aside class="disclaimer-banner" role="note">
        <strong>Not tax advice:</strong> This article is educational information only. Verify current law and deadlines through official NBR publications or a qualified professional.
      </aside>

      <div class="article-body">
        <section v-for="section in post.sections" :key="section.heading" class="article-section">
          <h2>{{ section.heading }}</h2>
          <p v-for="(paragraph, index) in section.content" :key="index">
            <template v-for="(token, tIndex) in formatTokens(paragraph)" :key="tIndex">
              <strong v-if="token.type === 'bold'">{{ token.value }}</strong>
              <span v-else>{{ token.value }}</span>
            </template>
          </p>
        </section>
      </div>

      <section class="sources-section" aria-labelledby="sources-heading">
        <h2 id="sources-heading">Official Sources</h2>
        <p>Statutory references and sources supporting this guide:</p>
        <ul>
          <li v-for="source in post.citations" :key="source">
            <span class="citation-text">{{ citationText(source) }} </span>
            <a :href="sourceUrl(source)" target="_blank" rel="noopener noreferrer" class="citation-link" :aria-label="`Open official NBR source for: ${citationText(source)}`">
              [Official NBR Source ↗]
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
  </div>
  <div v-else class="not-found">
    <h1>Guide Not Found</h1>
    <p>This guide does not exist.</p>
    <router-link to="/blog">Browse all tax guides →</router-link>
  </div>
</template>

<script>
import { getBlogPost } from '@/data/blogPosts'

export default {
  name: 'BlogPost',
  props: {
    slug: {
      type: String,
      default: null
    }
  },
  computed: {
    post() {
      return getBlogPost(this.slug || this.$route.params.slug)
    }
  },
  watch: {
    post: {
      immediate: true,
      handler(post) {
        if (post) {
          document.title = `${post.title} | BD Tax Calculator`
          const description = document.querySelector('meta[name="description"]')
          if (description) description.content = post.excerpt
          const ogTitle = document.querySelector('meta[property="og:title"]')
          if (ogTitle) ogTitle.content = `${post.title} | BD Tax Calculator`
          const ogDesc = document.querySelector('meta[property="og:description"]')
          if (ogDesc) ogDesc.content = post.excerpt
        }
      }
    }
  },
  methods: {
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
  padding: var(--space-5) var(--space-4) var(--space-6);
  background: var(--bg);
}

.article-container {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-5);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.breadcrumb {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-5);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.breadcrumb a { color: var(--accent); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.breadcrumb span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.article-header { margin-bottom: var(--space-5); }
.article-header h1 {
  margin-bottom: var(--space-3);
  color: var(--text);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
}
.article-lead { color: var(--text-muted); font-size: var(--text-lg); line-height: 1.55; }

.disclaimer-banner {
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  background: var(--warn-soft);
  border-left: 4px solid var(--warn);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.article-section { margin-bottom: var(--space-5); }
.article-section h2, .sources-section h2 {
  margin-bottom: var(--space-3);
  font-size: var(--text-xl);
  letter-spacing: -0.015em;
}
.article-section p { margin-bottom: var(--space-3); line-height: 1.7; }
.article-section p :deep(strong) { font-weight: 650; }
.article-section p :deep(em) { font-style: italic; }

.sources-section {
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}
.sources-section p { margin-bottom: var(--space-3); color: var(--text-muted); }
.sources-section ul { padding-left: 1.5rem; }
.sources-section li { margin-bottom: var(--space-2); overflow-wrap: anywhere; }
.sources-section a { color: var(--accent); }
.source-caution { margin-top: var(--space-3); font-size: var(--text-sm); }

.calculator-callout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  margin-top: var(--space-5);
}

.callout-text strong {
  display: block;
  font-size: var(--text-sm);
  color: var(--text);
  margin-bottom: 2px;
}

.callout-text p {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.callout-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 38px;
  padding: 0 var(--space-4);
  background: var(--accent);
  color: var(--on-accent);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.callout-btn:hover,
.callout-btn:focus-visible {
  background: var(--accent-hover);
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

@media (max-width: 600px) {
  .calculator-callout {
    flex-direction: column;
    align-items: flex-start;
  }
}
.back-link { color: var(--accent); font-weight: 600; text-decoration: none; }
.back-link:hover { text-decoration: underline; }

.not-found { max-width: 760px; margin: var(--space-6) auto; padding: var(--space-5); }
.not-found p { margin: var(--space-3) 0; }
.not-found a { color: var(--accent); }

@media (max-width: 600px) {
  .article-container { padding: var(--space-4); }
}
</style>
