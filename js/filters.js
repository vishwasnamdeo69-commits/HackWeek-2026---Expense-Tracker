// ==========================================================================
// filters.js — search, category/month filtering, and sorting
// ==========================================================================

import { MONTH_FILTER_ALL, CATEGORY_FILTER_ALL } from './constants.js';

/**
 * Apply the current filter/sort configuration to a list of expenses.
 * Pure function — takes expenses + filters, returns a new filtered array.
 */
export function applyFilters(expenses, filters) {
  const { search, category, month, sort } = filters;
  let list = expenses.slice();

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((e) => e.title.toLowerCase().includes(q) || (e.note || '').toLowerCase().includes(q));
  }

  if (category && category !== CATEGORY_FILTER_ALL) {
    list = list.filter((e) => e.category === category);
  }

  if (month && month !== MONTH_FILTER_ALL) {
    list = list.filter((e) => e.date.slice(0, 7) === month);
  }

  switch (sort) {
    case 'date-asc':
      list.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
      break;
    case 'amount-desc':
      list.sort((a, b) => b.amount - a.amount);
      break;
    case 'amount-asc':
      list.sort((a, b) => a.amount - b.amount);
      break;
    case 'date-desc':
    default:
      list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
      break;
  }

  return list;
}
