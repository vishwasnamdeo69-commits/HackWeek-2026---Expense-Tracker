// ==========================================================================
// budget.js — monthly budget management and utilization calculations
// ==========================================================================

import { state, setBudgetState } from './state.js';
import { expensesForMonth, sumSpend } from './expenses.js';
import { BUDGET_THRESHOLDS } from './constants.js';
import { todayISO } from './utils.js';

export function setBudget(amount) {
  setBudgetState({ amount: Math.round(Number(amount) * 100) / 100, updatedAt: Date.now() });
}

export function updateBudget(amount) {
  setBudget(amount);
}

export function removeBudget() {
  setBudgetState(null);
}

/**
 * Compute this month's budget status.
 * @returns {{
 *   hasBudget: boolean, amount: number, spent: number, remaining: number,
 *   utilization: number, status: 'ok'|'warning'|'danger'
 * }}
 */
export function getBudgetStatus(monthKeyStr = todayISO().slice(0, 7)) {
  const spent = sumSpend(expensesForMonth(monthKeyStr));
  const hasBudget = !!state.budget;
  const amount = hasBudget ? state.budget.amount : 0;
  const utilization = hasBudget && amount > 0 ? spent / amount : 0;
  const remaining = hasBudget ? amount - spent : 0;

  let status = 'ok';
  if (hasBudget) {
    if (utilization >= BUDGET_THRESHOLDS.danger) status = 'danger';
    else if (utilization >= BUDGET_THRESHOLDS.warning) status = 'warning';
  }

  return { hasBudget, amount, spent, remaining, utilization, status };
}
