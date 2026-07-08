// ==========================================================================
// analytics.js — derived insights: monthly summary, breakdowns, trends
// ==========================================================================

import { state } from './state.js';
import { expensesForMonth, sumSpend } from './expenses.js';
import { CATEGORY_MAP } from './constants.js';
import { monthKey, monthLabel, todayISO } from './utils.js';

/** Full monthly insight card data for the given month (defaults to current). */
export function computeMonthlySummary(monthKeyStr = todayISO().slice(0, 7)) {
  const monthExpenses = expensesForMonth(monthKeyStr).filter((e) => e.category !== 'income');
  const total = sumSpend(monthExpenses);
  const count = monthExpenses.length;

  const byCategory = {};
  monthExpenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });
  let highestCategory = null;
  let highestAmount = 0;
  Object.entries(byCategory).forEach(([cat, amt]) => {
    if (amt > highestAmount) { highestAmount = amt; highestCategory = cat; }
  });

  const daysElapsed = (() => {
    const [y, m] = monthKeyStr.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
    if (isCurrentMonth) return now.getDate();
    return new Date(y, m, 0).getDate(); // full days in that month
  })();

  const avgDaily = daysElapsed > 0 ? total / daysElapsed : 0;

  let largest = null;
  monthExpenses.forEach((e) => {
    if (!largest || e.amount > largest.amount) largest = e;
  });

  return {
    monthKey: monthKeyStr,
    total,
    count,
    highestCategory,
    highestAmount,
    avgDaily,
    largest,
  };
}

/** Category → amount breakdown for a given month, sorted descending. */
export function computeCategoryBreakdown(monthKeyStr = todayISO().slice(0, 7)) {
  const monthExpenses = expensesForMonth(monthKeyStr).filter((e) => e.category !== 'income');
  const totals = {};
  monthExpenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return Object.entries(totals)
    .map(([id, value]) => ({ id, label: CATEGORY_MAP[id]?.label || id, color: CATEGORY_MAP[id]?.color, value }))
    .sort((a, b) => b.value - a.value);
}

/** Spending trend for the last `n` months, ending with the current month. */
export function computeMonthlyTrend(n = 6) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(key);
  }
  return months.map((key) => ({
    monthKey: key,
    label: monthLabel(key),
    total: sumSpend(expensesForMonth(key)),
  }));
}

/** Category comparison across the same last-n-months window (stacked totals). */
export function computeCategoryComparison(n = 6) {
  const now = new Date();
  const months = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  const totalsByCategory = {};
  months.forEach((key) => {
    expensesForMonth(key).forEach((e) => {
      if (e.category === 'income') return;
      totalsByCategory[e.category] = (totalsByCategory[e.category] || 0) + e.amount;
    });
  });
  return Object.entries(totalsByCategory)
    .map(([id, value]) => ({ id, label: CATEGORY_MAP[id]?.label || id, color: CATEGORY_MAP[id]?.color, value }))
    .sort((a, b) => b.value - a.value);
}
