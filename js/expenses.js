// ==========================================================================
// expenses.js — CRUD operations over the expenses collection
// ==========================================================================

import { state, setExpenses } from './state.js';
import { uid } from './utils.js';

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} title
 * @property {number} amount
 * @property {string} category
 * @property {string} date - ISO yyyy-mm-dd
 * @property {string} [note]
 * @property {number} createdAt
 */

/** Validate raw form input; returns { valid, errors } */
export function validateExpenseInput({ title, amount, category, date }) {
  const errors = {};
  if (!title || !title.trim()) errors.title = 'Give this expense a title.';
  if (title && title.trim().length > 80) errors.title = 'Keep the title under 80 characters.';

  const num = Number(amount);
  if (amount === '' || amount === undefined || amount === null) errors.amount = 'Enter an amount.';
  else if (Number.isNaN(num)) errors.amount = 'Amount must be a number.';
  else if (num <= 0) errors.amount = 'Amount must be greater than zero.';

  if (!category) errors.category = 'Choose a category.';
  if (!date) errors.date = 'Pick a date.';

  return { valid: Object.keys(errors).length === 0, errors };
}

export function addExpense({ title, amount, category, date, note }) {
  const expense = {
    id: uid(),
    title: title.trim(),
    amount: Math.round(Number(amount) * 100) / 100,
    category,
    date,
    note: note ? note.trim() : '',
    createdAt: Date.now(),
  };
  setExpenses([expense, ...state.expenses]);
  return expense;
}

export function updateExpense(id, patch) {
  const next = state.expenses.map((e) => {
    if (e.id !== id) return e;
    const updated = { ...e, ...patch };
    if (patch.amount !== undefined) updated.amount = Math.round(Number(patch.amount) * 100) / 100;
    if (patch.title !== undefined) updated.title = patch.title.trim();
    if (patch.note !== undefined) updated.note = patch.note.trim();
    return updated;
  });
  setExpenses(next);
}

export function deleteExpense(id) {
  setExpenses(state.expenses.filter((e) => e.id !== id));
}

export function getExpenseById(id) {
  return state.expenses.find((e) => e.id === id) || null;
}

/** All expenses that fall within the given YYYY-MM key. */
export function expensesForMonth(monthKeyStr) {
  return state.expenses.filter((e) => e.date.slice(0, 7) === monthKeyStr);
}

/** Total amount for a set of expenses, excluding income category. */
export function sumSpend(expenses) {
  return expenses
    .filter((e) => e.category !== 'income')
    .reduce((sum, e) => sum + e.amount, 0);
}
