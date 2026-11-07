/**
 * Educational articles on Bangladesh personal income tax.
 *
 * Source status (retrieved 8 Nov 2026):
 *  - Income Tax Act, 2023, Authentic English Text (S.R.O. No. 404-Law/2025), via NBR PDF
 *    https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf
 *    Section 2 clauses 15 (income year), 23 (Tax Day), 24 (assessment year) read in the
 *    retrieved text. The retrieved text was truncated before Section 78 and the Sixth Schedule.
 *  - Section 78 wording is confirmed only by secondary mirrors, not by the NBR PDF.
 *    Those claims are flagged in the article text.
 *
 * Not tax advice. Verify against the official text before relying on any figure.
 */

export const BLOG_POSTS = [
  {
    slug: 'fiscal-year-vs-assessment-year-bangladesh',
    title: 'Fiscal Year vs Assessment Year in Bangladesh Income Tax',
    excerpt:
      'Why the year you earn income and the year you file it are different, and how Section 2 of the Income Tax Act, 2023 defines each.',
    citations: [
      'Income Tax Act, 2023 (Act No. XII of 2023), Section 2(15) "income year", Section 2(24) "assessment year" — NBR authentic English text (S.R.O. 404-Law/2025): https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf',
    ],
    sections: [
      {
        heading: 'Two years, one income',
        content: [
          'Bangladesh tax law uses two labels for the same money. The **income year** is the period in which you earned income. The **assessment year** is the period in which that income is assessed and returned.',
          'For an individual, the statute defines the assessment year as 12 months beginning on 1 July, and the income year as the financial year immediately before it (Section 2(15) and 2(24) of the Income Tax Act, 2023).',
        ],
      },
      {
        heading: 'Worked mapping',
        content: [
          'Income earned 1 July 2025 to 30 June 2026 is income year **2025–26**. It is reported in assessment year **2026–27** (1 July 2026 to 30 June 2027).',
          'The calculator uses the income-year label (for example FY 2025–26). Check that your return uses the matching assessment year.',
        ],
      },
      {
        heading: 'Tax Day',
        content: [
          'For an individual, "Tax Day" is the 30th of November following the end of the income year (Section 2(23)(a)). Section 2(23)(c) sets a 30 June date for individuals who have not filed a return before. Section 2(23)(d) and (e) cover other cases. Read the full clause before relying on a date.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'This article is general information, not tax advice. It does not replace professional advice for your situation.',
        ],
      },
    ],
  },
  {
    slug: 'section-78-investment-rebate-bangladesh',
    title: 'Section 78 Investment Rebate: How the Limit Is Computed',
    excerpt:
      'The three-part limit used for the investment rebate in the calculator, and which parts are confirmed by the official text.',
    citations: [
      'Income Tax Act, 2023, Section 78 and Sixth Schedule Part 3 — NBR authentic English text: https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf (Section 78 not retrieved in the verification run; the figures below are from secondary mirrors and must be checked against the NBR text.)',
    ],
    sections: [
      {
        heading: 'What the rebate does',
        content: [
          'A rebate reduces the computed tax directly. It is different from an exemption, which lowers the income that is taxed.',
        ],
      },
      {
        heading: 'Formula as the calculator applies it (unverified against NBR text)',
        content: [
          'Rebate = the lowest of: 3% of taxable income; 10% of eligible investment; BDT 7,50,000.',
          'The calculator engine (src/utils/taxSlabs2026.js) uses these values. Confirm against Section 78 of the NBR text before relying on them.',
        ],
      },
      {
        heading: 'Example',
        content: [
          'Taxable income BDT 15,00,000 and eligible investment BDT 2,50,000: 3% of income = 45,000; 10% of investment = 25,000; cap = 7,50,000. Rebate = BDT 25,000.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'This article is general information, not tax advice. Eligible investment categories and their limits are set by the Sixth Schedule. Check them with the official text.',
        ],
      },
    ],
  },
  {
    slug: 'prepare-income-tax-return-process-bangladesh',
    title: 'Preparing Your Individual Return: A Process Checklist',
    excerpt:
      'A process-only checklist for gathering records before you file. It does not state rates, portal steps or fees.',
    citations: [
      'Income Tax Act, 2023, Section 2(23) "Tax Day" — NBR authentic English text: https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf',
    ],
    sections: [
      {
        heading: 'Gather records for the income year',
        content: [
          'Collect the records covering the income year (1 July to 30 June): salary statements from your employer, bank interest and profit certificates, and proof of any investments you plan to claim.',
          'Keep a copy of every document you submit.',
        ],
      },
      {
        heading: 'Know the Tax Day',
        content: [
          'For an individual, Tax Day is the 30th of November following the end of the income year, under Section 2(23)(a). Confirm current extensions in NBR public notices, which this article does not cover.',
        ],
      },
      {
        heading: 'Ask a professional when needed',
        content: [
          'Complex income, foreign income, or a notice from your tax authority is a good reason to consult a qualified professional. The referral page explains how requests are handled.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'This article is general information, not tax advice.',
        ],
      },
    ],
  },
];

export function getBlogPost(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
