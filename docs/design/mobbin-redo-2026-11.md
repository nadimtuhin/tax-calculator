# Mobbin redo, Nov 2026: "Steve Jobs is simplifying the product"

Goal: one primary path (enter salary, see your tax). Everything else is one tap away, never gone.
No tax logic or numbers changed. FY 2025-26, FY 2026-27 (and FY 2024-25) stay selectable.

## References (Mobbin)

| # | Reference | What it taught us | Where used |
|---|-----------|-------------------|-----------|
| 1 | [Redfin affordability calculator](https://mobbin.com/screens/af24a9b8-c6eb-4097-ac80-c2f1f2ded4e3) | One huge number in a white card, supporting rows underneath | `.hero-payable` "You pay" figure |
| 2 | [Lightyear interest calculator](https://mobbin.com/screens/dbf0bc16-7914-4d6d-9454-ddf349080f1d) | Big result, small muted caption, fine print kept small | result + muted comparison caption |
| 3 | [Zopa loan calculator](https://mobbin.com/screens/c5633c8f-fa8e-4218-ba28-419ad7cb378e) | Segmented year-style choice next to a single answer | year picker kept compact |
| 4 | [Zillow rent calculator (web)](https://mobbin.com/screens/1b4626dd-6aad-469c-a426-2bc1748618c5) | Few inputs in a row, result card directly below | primary inputs then result |
| 5 | [Origin onboarding, "What's your legal name?"](https://mobbin.com/flows/c3a6fc47-bd8c-4587-bd6c-6e26103d7763) | Generous whitespace, one idea per screen, large heading | page hero, spacing scale |
| 6 | [Monzo "Your finances" setup](https://mobbin.com/flows/d86a85bd-c7c7-403b-9b07-c3f978a74d06) | Progress through sections, optional parts clearly optional | collapsed "Optional" sections |
| 7 | [Quicken planner, Basic/Advanced](https://mobbin.com/screens/83885d0d-82e5-45f1-94b4-17cd3148065e) | Advanced inputs behind an explicit toggle | `Disclosure` pattern |

## Cuts and why

| Cut | Reason | Ref |
|-----|--------|-----|
| Hero eyebrow, 2 pills, 3-line subtitle -> one line | Marketing words, none help enter salary | 5 |
| "Step 0N" eyebrows on every card | Numbering implied a wizard that does not exist | 6 |
| "Live Verdict" / "2-Year Delta" labels, duplicate delta figure | Jargon; the delta sentence already says it | 1, 2 |
| Result headline is now what you pay (FY target year) | The answer first, the comparison second | 1 |
| Investment rebate, taxable income detail, two full-year tables -> collapsed | Advanced; reachable with one tap | 6, 7 |
| Navbar labels, brand badge, button borders -> icons | Quieter nav; labels stay as aria-labels and tooltips | 5 |
| Card borders -> soft shadow only, grey canvas | Fewer lines and colours | 1, 5 |
| Mobile: result moved above the inputs | See the answer first, edit below | 1 |

## Nothing is unreachable

- Collapsed sections are real buttons (`aria-expanded`, `aria-controls`); panels use `v-show`, so ids and inputs persist.
- A section that holds entered data opens itself (investments, rebate repayable, zakat, solar, group insurance).
- Open state persists in `localStorage` key `tax-calculator-ui-open`.
- Random/Export/Import/Reset stay in the nav as icon buttons with the same aria-labels.

## Notes

- The brief mentions keeping "Ask a lawyer" wording; that exact string is not in master. The nav link "Lawyer Referral" and the disabled referral page are untouched.
- e2e config seeds `tax-calculator-ui-open=all` so existing specs can fill collapsed inputs; `tests/e2e/disclosure.spec.js` covers the collapsed default.
