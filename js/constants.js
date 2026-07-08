// ==========================================================================
// constants.js — categories, icon glyphs, storage keys, shared config
// ==========================================================================

export const STORAGE_KEYS = {
  EXPENSES: 'ledgerflow.expenses.v1',
  BUDGET: 'ledgerflow.budget.v1',
  PREFS: 'ledgerflow.prefs.v1',
};

// Minimal inline SVG path data (24x24 viewBox, stroke-based) — no external
// icon dependency, keeps the app to zero build tooling / zero network assets.
export const ICONS = {
  food: '<path d="M7 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 12v9M17 3c-1.5 1.5-2 3-2 5.5 0 2 1 3 2 3.5v9"/>',
  shopping: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  transport: '<path d="M4 16V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/><path d="M4 16h16"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/>',
  bills: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/>',
  entertainment: '<path d="M4 6h16v10H4z"/><path d="M2 20h20M9 6V4h6v2"/>',
  health: '<path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5c2-.3 4 1 6 3.5C14 6 16 4.7 18 5c3.5.5 5 4 3.5 7.5C19 16.65 12 21 12 21Z"/>',
  education: '<path d="M2 8l10-5 10 5-10 5-10-5Z"/><path d="M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"/>',
  travel: '<path d="M10.5 3 3 10.5l3 1 1.5 3 7.5-7.5c1.2-1.2 2.9-1.5 4-.4s.8 2.8-.4 4L11.1 18l3 1.5 1-3L21 9"/>',
  income: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  other: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M16 12h3"/><path d="M3 9h18"/>',
  chart: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h4"/>',
  warning: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 3.2 5.4 3.5 5.4 3.5a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  trend: '<path d="M3 17 9 11l4 4 8-8"/><path d="M15 7h6v6"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M17.5 15.5 20 18M6 18l2.5-2.5M17.5 8.5 20 6"/>',
};

// Default expense categories with dedicated accent + icon.
export const CATEGORIES = [
  { id: 'food', label: 'Food', color: 'var(--cat-food)', icon: ICONS.food },
  { id: 'shopping', label: 'Shopping', color: 'var(--cat-shopping)', icon: ICONS.shopping },
  { id: 'transport', label: 'Transport', color: 'var(--cat-transport)', icon: ICONS.transport },
  { id: 'bills', label: 'Bills', color: 'var(--cat-bills)', icon: ICONS.bills },
  { id: 'entertainment', label: 'Entertainment', color: 'var(--cat-entertainment)', icon: ICONS.entertainment },
  { id: 'health', label: 'Health', color: 'var(--cat-health)', icon: ICONS.health },
  { id: 'education', label: 'Education', color: 'var(--cat-education)', icon: ICONS.education },
  { id: 'travel', label: 'Travel', color: 'var(--cat-travel)', icon: ICONS.travel },
  { id: 'income', label: 'Income', color: 'var(--cat-income)', icon: ICONS.income },
  { id: 'other', label: 'Other', color: 'var(--cat-other)', icon: ICONS.other },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

export const CURRENCY = {
  code: 'INR',
  symbol: '\u20B9', // ₹
  locale: 'en-IN',
};

export const BUDGET_THRESHOLDS = {
  warning: 0.75, // amber from this utilization
  danger: 1.0,   // red at/over 100%
};

export const SORT_OPTIONS = [
  { id: 'date-desc', label: 'Newest first' },
  { id: 'date-asc', label: 'Oldest first' },
  { id: 'amount-desc', label: 'Amount: high to low' },
  { id: 'amount-asc', label: 'Amount: low to high' },
];

export const MONTH_FILTER_ALL = 'all';
export const CATEGORY_FILTER_ALL = 'all';
