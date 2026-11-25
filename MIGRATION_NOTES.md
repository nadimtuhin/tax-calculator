# Vue CLI → Vite migration (v1 app)

## What changed
- Build: `@vue/cli-service` (webpack 5, webpack-dev-server 4) → Vite 8 + `@vitejs/plugin-vue`. Config in `vite.config.mjs`.
- `public/index.html` → `index.html` at repo root (Vite entry); `<%= BASE_URL %>` → `/`, plus `<script type="module" src="/src/main.js">`. SEO tags, GA4 and canonical unchanged.
- Tests: Jest 30 + `@vue/vue3-jest` + babel-jest → Vitest 4.1 (jsdom, globals; v5 requires Node 22.12+, CI matrix includes Node 20). Test changes are mechanical only: `jest.*` → `vi.*`, one `require` → `await import`, constructor mocks use `function` (Vitest calls mocks with `new`), index.html path.
- Removed: `vue.config.js`, `babel.config.js`, `__mocks__/perfect-debounce.js`, Vue CLI plugins, Jest packages, `@babel/preset-env`, webpack-era yarn resolutions.
- Kept resolutions: `@vue/server-renderer` pin; `js-beautify/glob` → ^14.0.2 and `editorconfig/minimatch` → ^11.0.1 (via `@vue/test-utils`; clears minimatch <11.0.1).
- `.vue` extensionless imports keep working via `resolve.extensions`.
- Async chunks for Blog, BlogPost, Referrals, StarModal; nothing is preloaded in index.html. `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` is defined `false`.
- Modern-only build (no legacy plugin).

## Hosting
- `vercel.json`: `framework: vite`, `buildCommand`, `outputDirectory: dist`, and an SPA fallback rewrite (`/((?!api/).*)` → `/index.html`) after `/mcp`. Vercel's Vue CLI preset had a built-in SPA fallback and the Vite preset doesn't, so without the rewrite `/blog/<slug>` deep links would 404. `functions` untouched.
- `netlify.toml`: `[build] command = "yarn build"`, `publish = "dist"`. `public/_redirects` is still copied to dist.

## Verification
- `yarn test`: 34 files / 1009 tests, same as Jest before.
- `node scripts/golden-tax.mjs`: byte-identical output before and after (engine sweep + store getters).
- `yarn audit`: 0 vulnerabilities.
- CI: dropped Jest-only `--detectOpenHandles` (Vitest rejects it) and the webpack `--openssl-legacy-provider` flag.
- `engines.node` raised to `>=20.19.0 <25.0.0` (Vite 8 minimum). Netlify production context still pins Node 10 per netlify.toml; it could not build under Vue CLI 5 either. Set NODE_VERSION there if Netlify production matters.
