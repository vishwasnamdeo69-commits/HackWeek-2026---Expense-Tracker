// ==========================================================================
// storage.js — sole owner of LocalStorage reads/writes
// ==========================================================================

import { STORAGE_KEYS } from './constants.js';

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (err) {
    console.warn('LedgerFlow: failed to parse stored data, using fallback.', err);
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('LedgerFlow: LocalStorage write failed.', err);
    return false;
  }
}

export const storage = {
  loadExpenses() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.EXPENSES), []);
  },
  saveExpenses(expenses) {
    return safeWrite(STORAGE_KEYS.EXPENSES, expenses);
  },

  loadBudget() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.BUDGET), null);
  },
  saveBudget(budget) {
    return safeWrite(STORAGE_KEYS.BUDGET, budget);
  },

  loadPrefs() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.PREFS), {
      lastCelebratedMonth: null,
    });
  },
  savePrefs(prefs) {
    return safeWrite(STORAGE_KEYS.PREFS, prefs);
  },
};
