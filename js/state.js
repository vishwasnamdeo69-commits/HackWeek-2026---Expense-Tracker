// ==========================================================================
// state.js — single source of truth for in-memory application state
// ==========================================================================

import { storage } from './storage.js';
import { Emitter } from './utils.js';
import { MONTH_FILTER_ALL, CATEGORY_FILTER_ALL } from './constants.js';

export const bus = new Emitter();

export const state = {
  expenses: storage.loadExpenses(),
  budget: storage.loadBudget(), // { amount: number, updatedAt: iso } | null
  prefs: storage.loadPrefs(),
  filters: {
    search: '',
    category: CATEGORY_FILTER_ALL,
    month: MONTH_FILTER_ALL,
    sort: 'date-desc',
  },
};

/** Events emitted: 'expenses:changed' | 'budget:changed' | 'filters:changed' */

export function setExpenses(next) {
  state.expenses = next;
  storage.saveExpenses(state.expenses);
  bus.emit('expenses:changed', state.expenses);
}

export function setBudgetState(next) {
  state.budget = next;
  storage.saveBudget(state.budget);
  bus.emit('budget:changed', state.budget);
}

export function setPrefs(next) {
  state.prefs = { ...state.prefs, ...next };
  storage.savePrefs(state.prefs);
}

export function setFilters(partial) {
  state.filters = { ...state.filters, ...partial };
  bus.emit('filters:changed', state.filters);
}

export function getAvailableMonths() {
  const set = new Set(state.expenses.map((e) => e.date.slice(0, 7)));
  return Array.from(set).sort().reverse();
}
