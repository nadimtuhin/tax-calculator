// Post-build step: writes static HTML for content routes and sitemap.xml into dist/.
// Uses the SSR bundle from `vite build --ssr src/entry-server.js`; no browser needed.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const { render, PRERENDER_ROUTES, BLOG_POSTS, CANONICAL_ORIGIN } = await import(
  pathToFileURL(join(ssrDir, 'entry-server.mjs')).href
)

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

function replaceOnce(html, pattern, replacement, label) {
  const found = typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html)
  if (!found) throw new Error(`prerender: index.html has no ${label}`)
  return html.replace(pattern, replacement)
}

function withHead(template, { title, description }, url) {
  const t = escapeAttr(title)
  const d = escapeAttr(description)
  let html = template
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, () => `<title>${escapeText(title)}</title>`, '<title>')
  html = replaceOnce(html, /(<meta\s+name="description"\s+content=")[^"]*"/, (_, a) => `${a}${d}"`, 'meta description')
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*"/, (_, a) => `${a}${url}"`, 'canonical')
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*"/, (_, a) => `${a}${url}"`, 'og:url')
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*"/, (_, a) => `${a}${t}"`, 'og:title')
  html = replaceOnce(html, /(<meta\s+property="og:description"\s+content=")[^"]*"/, (_, a) => `${a}${d}"`, 'og:description')
  html = replaceOnce(html, /(<meta name="twitter:title" content=")[^"]*"/, (_, a) => `${a}${t}"`, 'twitter:title')
  html = replaceOnce(html, /(<meta\s+name="twitter:description"\s+content=")[^"]*"/, (_, a) => `${a}${d}"`, 'twitter:description')
  return html
}

const template = await readFile(join(dist, 'index.html'), 'utf8')

for (const route of PRERENDER_ROUTES) {
  const url = `${CANONICAL_ORIGIN}${route.path}`
  const body = await render(route.path)
  const html = replaceOnce(
    withHead(template, route.meta, url),
    '<div id="app"></div>',
    () => `<div id="app">${body}</div>`,
    '<div id="app"></div>'
  )
  // /x is served from x/index.html by Netlify and Vercel, and from x.html by `vite preview`
  // (its SPA fallback skips directory indexes without a trailing slash). Real files win over
  // the SPA fallback on all three.
  for (const out of [join(dist, `${route.path}.html`), join(dist, route.path, 'index.html')]) {
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, html)
  }
  console.log(`prerendered ${route.path}`)
}

const sitemapPaths = ['/', '/blog', ...BLOG_POSTS.map((p) => `/blog/${p.slug}`), '/referrals']
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((p) => `  <url><loc>${CANONICAL_ORIGIN}${p}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(join(dist, 'sitemap.xml'), sitemap)
console.log(`sitemap.xml: ${sitemapPaths.length} urls`)

await rm(ssrDir, { recursive: true, force: true })
