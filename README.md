# LedgerFlow

**A premium, browser-only personal finance dashboard.** Track expenses, set monthly budgets, and explore spending habits through live, animated analytics — no backend, no accounts, no build step.

> Built for HackWeek 2026.

![LedgerFlow dashboard](screenshots/dashboard.png)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Accessibility](#accessibility)
- [Performance Notes](#performance-notes)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Credits](#credits)

---

## Overview

Most expense trackers are either a spreadsheet in disguise or a barebones CRUD form. LedgerFlow is built to feel like a real fintech product — the kind of interface you'd expect from Mercury, Ramp, or Revolut — while running entirely client-side with **zero dependencies beyond a single charting library**.

Every expense you log, every budget you set, and every preference you configure is saved to your browser's LocalStorage. Close the tab, come back tomorrow — everything is exactly where you left it.

## Features

- **Expense management** — add, edit, and delete transactions with inline validation and smooth enter/exit animations.
- **Custom categories** — 10 built-in categories, each with a unique icon and accent color (Food, Shopping, Transport, Bills, Entertainment, Health, Education, Travel, Income, Other).
- **Monthly budgeting** — set, edit, or remove a budget; watch an animated progress ring shift from green → amber → red as you approach the limit, with contextual alerts.
- **Live dashboard summary** — four stat cards (budget, spend, remaining, transaction count) that count up smoothly whenever the underlying data changes.
- **Monthly insights** — automatically calculated highest category, average daily spend, largest single expense, and transaction count.
- **Analytics suite** — an animated doughnut chart (category distribution), line chart (6-month trend), and bar chart (category comparison), all built on Chart.js and themed to match the dashboard.
- **Search, filter & sort** — debounced title/note search, category and month filters, and sort by date or amount.
- **Local persistence** — expenses, budget, and preferences are restored automatically via LocalStorage.
- **Fully responsive** — desktop, tablet, and mobile layouts with touch-friendly controls and no layout shift.
- **Accessible by default** — semantic HTML, keyboard navigation, visible focus states, ARIA labeling, and full `prefers-reduced-motion` support.
- **A small delight** — stay under budget through the last day of the month and LedgerFlow celebrates with a confetti burst.

## Screenshots

> Replace these placeholders with real captures from your running instance.

| Dashboard | Analytics | Budget Panel |
|---|---|---|
| `screenshots/dashboard.png` | `screenshots/analytics.png` | `screenshots/budget.png` |

## Technologies Used

- **HTML5** — semantic structure
- **CSS3** — custom properties (design tokens), Grid/Flexbox layout, keyframe animations
- **Vanilla JavaScript (ES Modules)** — no framework, no bundler
- **[Chart.js](https://www.chartjs.org/)** (via CDN) — the only external dependency, used strictly for chart rendering
- **[Inter](https://fonts.google.com/specimen/Inter)** & **[JetBrains Mono](https://www.jetbrains.com/lp/mono/)** (Google Fonts) — UI and "ledger" numeral typefaces

No React, Vue, Angular, Bootstrap, Tailwind, jQuery, or build tooling of any kind.

## Getting Started

LedgerFlow has no dependencies to install and no build step. Simply open it:

```bash
# Clone or download the repository, then:
cd ExpenseTracker
# Open index.html directly in a browser, or serve it locally:
python3 -m http.server 8080
# then visit http://localhost:8080
```

> Opening `index.html` directly (double-click) also works in most browsers, since the app uses no server-side APIs. A local server is only needed because some browsers restrict ES Module imports over the `file://` protocol.

## Usage Guide

1. **Add an expense** — fill in the form on the right of the "Manage expenses" section: title, amount, date, category, and an optional note. Click **Add expense**.
2. **Edit or delete** — hover any row in the expense list to reveal edit/delete controls. Deleting always asks for confirmation.
3. **Set a budget** — in the Budget Overview card, click **Set monthly budget** and enter an amount. The progress ring and alerts update instantly as you spend.
4. **Explore analytics** — scroll to the Spending Analytics section to see your category breakdown, 6-month trend, and category comparison update live.
5. **Search & filter** — use the toolbar above the expense list to search by title/note, filter by category or month, and sort by date or amount.

## Architecture

LedgerFlow follows a strict single-responsibility module system with a simple pub/sub event bus in place of a framework's reactivity system:

```
User Action → Validate Input → Update State → Persist to LocalStorage
            → Recalculate Analytics → Update Charts → Re-render Dashboard
```

`state.js` holds the in-memory source of truth and emits `expenses:changed`, `budget:changed`, and `filters:changed` events. `app.js` subscribes to these events and triggers a full re-render pass, so every part of the UI — summary cards, budget ring, insights, charts, and the expense list — always reflects the latest state without manual synchronization.

### Module Responsibilities

| File | Responsibility |
|---|---|
| `js/app.js` | Application bootstrap; wires DOM events to state mutations and triggers renders |
| `js/state.js` | Central in-memory state store + pub/sub event bus |
| `js/storage.js` | Sole owner of all LocalStorage reads/writes |
| `js/expenses.js` | Expense CRUD operations and validation |
| `js/budget.js` | Budget set/update/remove and utilization calculations |
| `js/analytics.js` | Monthly summaries, category breakdowns, trend and comparison data |
| `js/charts.js` | Chart.js instance creation, theming, and live updates |
| `js/renderer.js` | All DOM writes — cards, budget ring, list rows, toasts, modals |
| `js/filters.js` | Search, category/month filtering, and sorting logic |
| `js/utils.js` | Currency/date formatting, debounce, number counting animation, id generation |
| `js/constants.js` | Category definitions, icon glyphs, storage keys, shared config |

### Budget Calculation Logic

Utilization is computed as `spent / budgetAmount` for the current calendar month, where `spent` excludes the "Income" category. Status thresholds: **ok** below 75%, **warning** from 75–99%, **danger** at 100% or above — driving both the progress ring color and the alert banner copy.

### Analytics Generation

- **Monthly summary** — total spend, transaction count, highest category, average daily spend (total ÷ days elapsed this month), and largest single expense — all recomputed from the raw expense list on every change.
- **Category breakdown** — current month's expenses grouped by category, sorted descending, feeding the doughnut chart and its legend.
- **Monthly trend** — total spend for each of the last 6 calendar months (including empty months as zero), feeding the line chart.
- **Category comparison** — category totals summed across the same 6-month window, feeding the bar chart.

### Chart Implementation

All three charts are Chart.js instances created once and updated in place (`chart.update()`) rather than destroyed/recreated, so Chart.js's own transition animations handle the "smooth update" requirement. Colors are read from the CSS custom properties defined in `variables.css` at render time, so the charts always match the active design tokens.

### LocalStorage Strategy

Three keys are used: `ledgerflow.expenses.v1`, `ledgerflow.budget.v1`, and `ledgerflow.prefs.v1`. All reads are wrapped in a `try/catch` with safe fallbacks, so corrupted or missing data never crashes the app — it simply starts fresh for that key.

## Folder Structure

```
ExpenseTracker/
├── index.html
├── README.md
├── LICENSE
├── assets/
│   ├── icons/
│   ├── illustrations/
│   └── logo.svg
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   ├── animations.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── state.js
│   ├── storage.js
│   ├── expenses.js
│   ├── budget.js
│   ├── analytics.js
│   ├── charts.js
│   ├── renderer.js
│   ├── filters.js
│   ├── utils.js
│   └── constants.js
└── screenshots/
```

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`, `nav`) and a skip-to-content link.
- Every interactive control is keyboard-reachable with a visible focus ring (`:focus-visible`).
- Form fields carry associated `<label>` elements and inline error messaging.
- Icon-only buttons (edit/delete/close) include `aria-label`s.
- Charts include `role="img"` and a descriptive `aria-label` as a text alternative.
- Color is never the sole indicator of state — budget alerts pair color with an icon and explicit copy.
- All animation respects `prefers-reduced-motion: reduce`, disabling ambient motion, counting animations, and chart transitions.

## Performance Notes

- Search input is debounced (200ms) to avoid re-filtering on every keystroke.
- Charts are updated in place instead of destroyed and rebuilt, minimizing redraw cost.
- LocalStorage writes happen once per state mutation, not per render.
- Numeric "count-up" animations use `requestAnimationFrame` and are skipped entirely for reduced-motion users.

## Known Limitations

- Data is local to a single browser/device; there is no sync or export/import in this version.
- Budgets are tracked per calendar month only (no custom budget periods or rollover).
- No multi-currency support — all figures are formatted in INR (₹).

## Future Improvements

- CSV export/import for backing up or migrating data.
- Light/dark theme toggle.
- Recurring expense templates.
- Multi-month budget rollover and custom budget periods.
- A recent-activity timeline view alongside the flat expense list.

## License

Released under the [MIT License](LICENSE).

## Credits

Design direction inspired by Mercury, Ramp, Stripe Dashboard, Linear, Revolut, Monzo, and Apple Wallet. Built with Chart.js, Inter, and JetBrains Mono.
