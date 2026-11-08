/**
 * Educational articles on Bangladesh personal income tax.
 *
 * Statutory references:
 *  - Income Tax Act, 2023 (Act No. XII of 2023), Authentic English Text (S.R.O. No. 404-Law/2025),
 *    published by National Board of Revenue (NBR):
 *    https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf
 *  - Section 2(15) "income year" (আয় বর্ষ) & Section 2(24) "assessment year" (করবর্ষ)
 *  - Section 2(23)(a) "Tax Day" (কর দিবস)
 *  - Section 78 "General tax rebate in respect of certain investments and expenditure"
 *    as amended by the Finance Act, 2024 (Act No. IX of 2024), Section 61
 *  - Sixth Schedule Part 3 (eligible investments and allowable expenditure)
 *  - Section 166 (Return of income) & Section 167 (Statement of assets and liabilities)
 *
 * Not tax advice. General educational information only.
 */

export const BLOG_POSTS = [
  {
    slug: 'fiscal-year-vs-assessment-year-bangladesh',
    title: 'Fiscal Year vs Assessment Year in Bangladesh Income Tax',
    excerpt:
      'Why the year you earn income and the year you file it are different, and how Section 2 of the Income Tax Act, 2023 defines each.',
    citations: [
      'Income Tax Act, 2023 (Act No. XII of 2023), Section 2(15) "income year", Section 2(24) "assessment year", Section 2(23)(a) "Tax Day" — NBR authentic text (S.R.O. 404-Law/2025): https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf',
    ],
    sections: [
      {
        heading: 'Two years, one income cycle',
        content: [
          'Bangladesh tax law distinguishes between the period in which income is earned and the period in which it is formally returned and assessed. The **income year** (আয় বর্ষ) is the financial year during which you receive your earnings. The **assessment year** (করবর্ষ) is the statutory period immediately following that income year during which tax liability is assessed.',
          'Under Section 2(24) of the Income Tax Act, 2023, the assessment year is defined as the twelve-month period commencing on the 1st of July each year. Section 2(15) defines the income year for individuals as the financial year immediately preceding that assessment year (1 July through 30 June).',
        ],
      },
      {
        heading: 'Concrete mapping: FY vs AY',
        content: [
          '• **Income Year 2024–25 (FY 2024–25):** Runs from 1 July 2024 to 30 June 2025. It is filed and assessed in **Assessment Year 2025–26 (AY 2025–26)**.',
          '• **Income Year 2025–26 (FY 2025–26):** Runs from 1 July 2025 to 30 June 2026. It is filed and assessed in **Assessment Year 2026–27 (AY 2026–27)**.',
          'Our interactive calculator defaults to the active income year label (such as FY 2025–26) so you can enter the salary and investments you are currently receiving or forecasting.',
        ],
      },
      {
        heading: 'Tax Day statutory deadline',
        content: [
          'Under Section 2(23)(a) of the Income Tax Act, 2023, "Tax Day" for an individual taxpayer is the **30th day of November** following the end of the income year.',
          'The National Board of Revenue (NBR) periodically publishes circulars regarding return submission windows and any official filing extensions. Taxpayers should consult current NBR notifications for their specific filing year.',
        ],
      },
      {
        heading: 'Interactive calculator',
        content: [
          'Use our free calculator to test how your salary components and deductions map to your exact tax liability for both FY 2025–26 and FY 2026–27.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'This article is general educational information, not formal tax or legal advice. If you face special residency classifications, notices, or complex business income, consult a qualified Bangladesh tax advocate or verified NBR publications.',
        ],
      },
    ],
  },
  {
    slug: 'section-78-investment-rebate-bangladesh',
    title: 'Section 78 Investment Rebate: How the Limit Is Computed',
    excerpt:
      'The statutory three-part limit used for individual investment tax rebate under Section 78 of the Income Tax Act, 2023 and Finance Act amendments.',
    citations: [
      'Income Tax Act, 2023 (Act No. XII of 2023), Section 78 as amended by Finance Act, 2024 (Act No. IX of 2024), Section 61, and Sixth Schedule Part 3 — NBR authentic text: https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf',
    ],
    sections: [
      {
        heading: 'Rebate vs exemption: direct tax reduction',
        content: [
          'A **tax rebate** directly reduces the final tax amount payable to the government (a taka-for-taka reduction). In contrast, an **exemption** reduces total gross income before tax slabs are applied.',
          'Under Section 78 of the Income Tax Act, 2023, resident individuals and non-resident Bangladeshi individuals who invest in eligible instruments are entitled to an investment tax rebate deducted from their computed tax.',
        ],
      },
      {
        heading: 'The statutory three-part formula',
        content: [
          'Under Section 78(1) and (2) as amended by Section 61 of the Finance Act, 2024, the allowable rebate is the **lowest** of the following three amounts:',
          '1. **3% of taxable income (0.03 × A):** Where "A" is total taxable income excluding tax-exempt earnings, income taxed at reduced concessionary rates, partnership share income, and final minimum tax amounts under Section 163.',
          '2. **10% of qualifying investment (0.10 × B):** Where "B" is the total allowable investment and expenditure incurred during the income year under Part 3 of the Sixth Schedule (amended from 15% to 10% by Finance Act 2024).',
          '3. **BDT 7,50,000:** The statutory ceiling for individual rebate (amended from BDT 10,00,000 by Finance Act 2024).',
        ],
      },
      {
        heading: 'Worked numerical example',
        content: [
          'Suppose an individual has taxable income ("A") of BDT 15,00,000 and total eligible investments ("B") of BDT 2,50,000:',
          '• 3% of taxable income = BDT 45,000',
          '• 10% of eligible investment = BDT 25,000',
          '• Statutory cap = BDT 7,50,000',
          'The lowest of the three figures is **BDT 25,000**. This amount is deducted directly from the computed gross tax liability.',
        ],
      },
      {
        heading: 'Qualifying investments under Sixth Schedule Part 3',
        content: [
          'Allowable instruments under Part 3 of the Sixth Schedule include approved employee provident funds, deposit pension schemes (DPS) within statutory monthly limits, life insurance policies, government securities, and listed securities.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'This guide provides educational context on how Section 78 is structured. Statutory schedules and circulars are subject to legislative amendment. Always verify against the official NBR text or consult a licensed tax professional.',
        ],
      },
    ],
  },
  {
    slug: 'prepare-income-tax-return-process-bangladesh',
    title: 'Preparing Your Individual Return: A Process Checklist',
    excerpt:
      'A practical documentation checklist for salaried individuals before filing under the Income Tax Act, 2023.',
    citations: [
      'Income Tax Act, 2023 (Act No. XII of 2023), Section 2(23)(a) "Tax Day", Section 166 "Return of income", and Section 167 "Statement of assets and liabilities" — NBR authentic text (S.R.O. 404-Law/2025): https://nbr.gov.bd/uploads/acts/Income_tax_act_2023.pdf',
    ],
    sections: [
      {
        heading: 'Gather income year records',
        content: [
          'Collect all documentation spanning 1 July through 30 June of the relevant income year:',
          '• **Salary and tax deduction statement:** An official certificate or breakdown from your employer detailing gross salary, allowances, and tax deducted at source.',
          '• **Bank certificates:** Profit or interest statements showing gross return and tax deducted at source.',
          '• **Investment certificates:** Official deposit statements or receipts for qualifying investments under Sixth Schedule Part 3 (such as DPS, provident fund, insurance, or treasury bonds).',
        ],
      },
      {
        heading: 'Statement of assets and liabilities (Section 167)',
        content: [
          'Under Section 167 of the Income Tax Act, 2023, submission of a Statement of Assets and Liabilities (Form IT-10B) may be required depending on statutory net wealth thresholds and prescribed asset criteria (such as ownership of motor vehicles or real property).',
          'Taxpayers should review current NBR filing guidelines or consult the prescribed return package to verify if IT-10B submission applies to their individual profile.',
        ],
      },
      {
        heading: 'Calendar your filing timeline',
        content: [
          'Individual returns under Section 166 are due by Tax Day (30 November under Section 2(23)(a)), unless an official extension is notified by NBR. Gathering documents well in advance of Tax Day helps ensure accurate reconciliation between employer certificates and bank deduction records.',
        ],
      },
      {
        heading: 'When to seek licensed counsel',
        content: [
          'If your return involves complex asset reconciliations, multiple business streams, or assessment notices from tax authorities, consider consulting an independent licensed advocate or income tax practitioner. Visit our referral overview page for details.',
        ],
      },
      {
        heading: 'Disclaimer',
        content: [
          'This checklist is a general operational guide for salaried taxpayers and does not constitute formal legal or tax counsel.',
        ],
      },
    ],
  },
];

export function getBlogPost(slug) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
