// Shared by the client router and the build-time prerender (scripts/prerender.mjs).
export const CANONICAL_ORIGIN = 'https://tax.nadimtuhin.com'

export const ROUTE_META = {
  Home: {
    title: 'Bangladesh Tax calculator — FY 2025-26 & FY 2026-27 (BDT ৳)',
    description:
      'Calculate salaried income tax in Bangladesh for FY 2025-26 and FY 2026-27 (Finance Act 2026). Instant BDT (৳) slab breakdown, salary exemptions, monthly TDS, and Section 78 investment rebate.'
  },
  Blog: {
    title: 'Blog — Bangladesh Personal Income Tax Guides | BD Tax Calculator',
    description:
      'Plain-language guides to Bangladesh personal income tax: fiscal year vs assessment year, salary exemptions, Section 78 rebate, and how to prepare for filing your return.'
  },
  BlogPost: {
    // Title/description are set per-article inside BlogPost.
    title: 'Blog — Bangladesh Personal Income Tax Guides | BD Tax Calculator',
    description:
      'Plain-language guide to Bangladesh personal income tax from BD Tax Calculator. General information only — not tax advice.'
  },
  Referrals: {
    title: 'Lawyer Referral Service | BD Tax Calculator',
    description:
      'Informational overview of tax lawyer referrals in Bangladesh. Online submissions are currently paused; no tax or legal advice provided.'
  }
}

export const blogPostMeta = (post) => ({
  title: `${post.title} | BD Tax Calculator`,
  description: post.excerpt
})
