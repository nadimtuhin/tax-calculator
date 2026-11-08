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
        <div class="disclaimer-icon" aria-hidden="true">ℹ</div>
        <div class="disclaimer-text">
          <strong>Not formal tax advice:</strong> These guides are educational materials designed to explain how Bangladesh tax provisions function. Tax laws and statutory circulars change; always consult a licensed tax lawyer or verified NBR publications for your specific return.
        </div>
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

      <section class="posts-grid" aria-label="List of tax guides">
        <article
          v-for="post in posts"
          :key="post.slug"
          class="post-card"
        >
          <div class="card-badge-row" aria-hidden="true">
            <span class="card-tag">Statutory Guide</span>
          </div>
          <header class="card-header">
            <h2>
              <router-link :to="`/blog/${post.slug}`" class="post-title-link">
                {{ post.title }}
              </router-link>
            </h2>
          </header>
          <p class="post-excerpt">{{ post.excerpt }}</p>
          <footer class="card-footer">
            <router-link :to="`/blog/${post.slug}`" class="read-more-btn" :aria-label="`Read full guide: ${post.title}`">
              Read Guide <span aria-hidden="true">→</span>
            </router-link>
          </footer>
        </article>
      </section>
    </div>
  </div>
</template>

<script>
import { BLOG_POSTS } from '@/data/blogPosts'

export default {
  name: 'Blog',
  data() {
    return {
      posts: BLOG_POSTS
    }
  }
}
</script>

<style scoped>
.blog-page {
  background-color: var(--bg);
  min-height: calc(100vh - 64px);
  padding: var(--space-5) var(--space-4) var(--space-6);
}

.blog-container {
  max-width: 1080px;
  margin: 0 auto;
}

.blog-hero {
  margin-bottom: var(--space-5);
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
  margin-bottom: var(--space-2);
}

.blog-hero h1 {
  font-size: clamp(1.75rem, 3.5vw, 2.35rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text);
  margin-bottom: var(--space-2);
}

.hero-subtitle {
  font-size: var(--text-base);
  color: var(--text-muted);
  line-height: 1.5;
  max-width: 680px;
}

.disclaimer-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: var(--space-4);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow);
}

.disclaimer-icon {
  font-weight: bold;
  color: var(--accent);
  font-size: var(--text-lg);
  line-height: 1;
}

.disclaimer-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.5;
}

.disclaimer-text strong {
  color: var(--text);
}

.calculator-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-4) var(--space-5);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow);
}

.calculator-banner-content h2 {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-1);
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
  min-height: 40px;
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
}

@media (max-width: 640px) {
  .calculator-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ponytail: CSS grid 3-column on desktop and single column on mobile. Upgrade to masonry if varying excerpt length distorts layout. */
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
  }
}

.post-card {
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

.card-badge-row {
  margin-bottom: var(--space-3);
}

.card-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: var(--surface-muted);
  border: 1px solid var(--border);
  color: var(--accent);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card-header {
  margin-bottom: var(--space-2);
}

.post-card h2 {
  font-size: 1.125rem;
  font-weight: 650;
  letter-spacing: -0.015em;
  line-height: 1.35;
  margin: 0;
}

.post-title-link {
  color: var(--text);
  text-decoration: none;
}

.post-title-link:hover,
.post-title-link:focus-visible {
  color: var(--accent);
  text-decoration: underline;
}

.post-excerpt {
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.55;
  margin-bottom: var(--space-5);
  flex-grow: 1;
}

.card-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: auto;
}

.read-more-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 44px;
  padding: 0 var(--space-4);
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}

.read-more-btn:hover,
.read-more-btn:focus-visible {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
</style>
