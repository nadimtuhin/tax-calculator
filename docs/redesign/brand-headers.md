# Brand, Favicon & Header Hierarchy Note (2026 Fintech Pass)

## 1. Visual Direction & Mobbin References
Research via Mobbin MCP focused on 2025–2026 fintech navigation bars, brand lockups, calculator page heroes, and multi-step card section headers:

| Pattern | Reference | Mobbin Screen |
|---|---|---|
| Compact geometric glyph + dark-ink wordmark on optical baseline | Wise Web (nav lockup) | https://mobbin.com/screens/baeb769e-1f9b-4e31-947e-0d9764cd6bd5 |
| Rounded-square negative-space brand glyph + sparse utility bar | Stripe Web (header) | https://mobbin.com/screens/79932d8e-bd78-4595-a2f2-833f16fa72ec |
| Icon-only compact scale-down on narrow viewports | Stripe Web (app shell) | https://mobbin.com/screens/8d391011-f2a9-406b-8a8b-7f43d01ca5e1 |
| High-contrast wordmark & dark surface inversion | Revolut Web (sticky nav) | https://mobbin.com/screens/0609bbcd-b0ad-4815-90ee-c112f94dc7f4 |
| Low-noise action separation in top utility bar | Mercury Web (shell) | https://mobbin.com/screens/66d54fa0-da1a-4224-a027-d0b0ac2b6e2d |
| Tracked uppercase eyebrow pill + tight H1 + capped subtitle | Oyster Web (calculator hero) | https://mobbin.com/screens/09b3ff4b-6f76-4102-abe3-ef2091ce42f7 |
| Tinted pill eyebrow badge (unbordered brand tint) | Stripe Web (section header) | https://mobbin.com/screens/36b866f8-cb7f-4a42-b8df-a4863d7577ff |
| Numbered step eyebrow + H2 + right-floated live summary pill | Oyster Web (calculator cards) | https://mobbin.com/screens/edca9521-c472-4ee4-a55b-08e19da82b7a |
| Multi-step progress eyebrow + running amount badge | Oyster Web (step header) | https://mobbin.com/screens/0a9e24f1-8cc2-4fdc-9c4e-9c6d2105bebb |
| Emphasised invoice header & tabular-nums totals | Stripe Web (invoice summary) | https://mobbin.com/screens/01c6bae0-47c7-4ec9-890e-54c8af10524d |

## 2. Brand Mark & Favicon Generation (9router Cx)
- **Model**: `cx/gpt-5.6-sol-image` via local `9router` (`http://localhost:20128/v1/images/generations`).
- **Iteration**:
  1. Initial transparent pass produced a stylized `৳` with soft halo edges that softened at `16x16`.
  2. Opaque solid-emerald pass (`#0a5c3a` token family) produced a flat geometric monogram combining the Bengali Taka (`৳`) / `bt` stem-and-loop with a crimson Bangladesh sun counter dot (`#f42a41`), retaining crisp contrast at `16px`, `32px`, `180px`, and `512px`.
  3. Vectorized via `potrace` into a 1.1 KB dark-mode-adaptive `public/favicon.svg` and 841 B `src/assets/brand-mark.svg`, paired with supersampled PNG/ICO rasters (`favicon-16x16.png`, `favicon-32x32.png`, multi-size `favicon.ico`, full-bleed `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, and `og-image.png`).

## 3. Header & Document Metadata Improvements
- **Document `<head>`**: Replaced stale `"Tax calculator 2023-2024"` title and `"codesandbox"` noscript text with current FY 2025–26 & FY 2026–27 BDT metadata, light/dark `theme-color`, full favicon/manifest links, and OpenGraph + Twitter `summary_large_image` tags.
- **Navbar**: Replaced `🇧🇩` emoji placeholder with inline vector `.brand-mark` + optical-baseline `"BD Tax Calculator"` wordmark + `"FY 25–27"` pill badge, frosted sticky surface, and vertical separator before the GitHub link.
- **Heading Hierarchy (`h1` → `h2` → `h3`)**:
  - Added `<header class="page-hero">` with `<h1>Salaried Income Tax Calculator</h1>` and Finance Act 2026 context pills.
  - Upgraded all input, verdict, and calculation invoice cards with step/assessment-year eyebrows and right-aligned live `৳` summary pills.
  - Fixed sticky `.hero-column` grid containing block so the live comparison card cleanly stops above the side-by-side invoice breakdown cards instead of overlapping them on scroll.
