<template>
  <div class="blog-page">
    <div class="blog-container">
      <header class="blog-hero">
        <span class="hero-eyebrow">Bangladesh Income Tax · Guides</span>
        <h1>Income Tax Guides &amp; Statutory Notes</h1>
        <p class="hero-subtitle">
          Plain-language explanations of Bangladesh personal income tax under the Income Tax Act, 2023. Every statutory claim cites official legislation.
        </p>
      </header>

      <section class="disclaimer-banner" role="region" aria-label="Legal disclaimer">
        <svg class="disclaimer-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
        <div class="disclaimer-text">
          <strong>Not formal tax advice:</strong> These guides are educational materials designed to explain how Bangladesh tax provisions function. Tax laws and statutory circulars change; always consult a licensed tax lawyer or verified NBR publications for your specific return.
        </div>
      </section>

      <p class="guides-count">{{ guideCountLabel }}</p>

      <section class="posts-grid" aria-label="List of tax guides">
        <article
          v-for="post in posts"
          :key="post.slug"
          class="post-card"
        >
          <h2 class="post-title">
            <router-link :to="`/blog/${post.slug}`" class="post-title-link" :aria-label="`Read Guide: ${post.title}`">
              {{ post.title }}
            </router-link>
          </h2>
          <p class="post-excerpt">{{ post.excerpt }}</p>
          <footer class="card-footer">
            <span class="post-meta">{{ post.readingTime }}</span>
            <span class="read-more" aria-hidden="true">Read guide <span class="read-more-arrow">→</span></span>
          </footer>
        </article>
      </section>

      <!-- Calculator Callout -->
      <section class="calculator-banner" aria-label="Interactive Tax Calculator">
        <div class="calculator-banner-content">
          <h2>Interactive BD Tax Calculator</h2>
          <p>Estimate your taxable salary, progressive tax slabs, monthly TDS, and Section 78 investment rebate in seconds.</p>
        </div>
        <router-link to="/" class="calculator-banner-btn">
          Open Tax Calculator <span aria-hidden="true">→</span>
        </router-link>
      </section>
    </div>
  </div>
</template>

<script>
import { BLOG_POSTS } from '@/data/blogPosts'
import { readingTimeLabel } from '@/lib/blogGuide'

export default {
  name: 'Blog',
  data() {
    return {
      posts: BLOG_POSTS.map((post) => ({ ...post, readingTime: readingTimeLabel(post) }))
    }
  },
  computed: {
    guideCountLabel() {
      return `${this.posts.length} ${this.posts.length === 1 ? 'guide' : 'guides'}`
    }
  }
}
</script>

<style scoped>
.blog-page {
  background-color: var(--bg);
  min-height: calc(100vh - 64px);
  padding: var(--space-6) var(--space-4) calc(var(--space-6) * 2);
}

.blog-container {
  max-width: 1080px;
  margin: 0 auto;
}

.blog-hero {
  margin-bottom: var(--space-4);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: var(--space-3);
}

.blog-hero h1 {
  font-size: clamp(1.875rem, 4vw, 2.75rem);
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--text);
  margin-bottom: var(--space-3);
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-muted);
  line-height: 1.55;
  max-width: 62ch;
}

/* A quiet note, not a banner: it must stay visible but not outweigh the guides. */
.disclaimer-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  max-width: 82ch;
  margin-bottom: var(--space-6);
  color: var(--text-muted);
}

.disclaimer-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--accent);
}

.disclaimer-text {
  font-size: var(--text-sm);
  line-height: 1.55;
}

.disclaimer-text strong {
  color: var(--text);
}

.guides-count {
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
}

.posts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-5);
  }
}

.post-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.post-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.post-title {
  font-size: 1.1875rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  margin-bottom: var(--space-2);
}

.post-title-link {
  color: var(--text);
  text-decoration: none;
}

/* The title link is the card's only link; this stretches its hit area over the whole card. */
.post-title-link::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius);
}

.post-card:hover .post-title-link {
  color: var(--accent);
}

@supports selector(:has(*)) {
  .post-title-link:focus-visible {
    outline: none;
  }

  .post-card:has(.post-title-link:focus-visible) {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
}

.post-excerpt {
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.6;
  margin-bottom: var(--space-5);
  flex-grow: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
  font-size: var(--text-sm);
}

.post-meta {
  color: var(--text-muted);
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--accent);
  font-weight: 650;
}

.read-more-arrow {
  transition: transform 0.15s;
}

.post-card:hover .read-more-arrow {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .post-card,
  .read-more-arrow {
    transition: none;
  }

  .post-card:hover,
  .post-card:hover .read-more-arrow {
    transform: none;
  }
}

.calculator-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-6);
  padding: var(--space-4) var(--space-5);
  background: var(--accent-soft);
  border-radius: var(--radius);
}

.calculator-banner-content h2 {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 2px;
}

.calculator-banner-content p {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

.calculator-banner-btn {
  display: inline-flex;
  align-items: center;
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

.calculator-banner-btn:hover,
.calculator-banner-btn:focus-visible {
  background: var(--accent-hover);
  color: var(--on-accent);
}

@media (max-width: 640px) {
  .blog-page {
    padding-top: var(--space-5);
  }

  .calculator-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .calculator-banner-btn {
    justify-content: center;
  }
}
</style>
