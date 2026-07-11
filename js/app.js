// ==========================================================================
// app.js — application bootstrap & event orchestration
// ==========================================================================

import { state, bus, setFilters, getAvailableMonths, setPrefs } from './state.js';
import {
  addExpense, updateExpense, deleteExpense, getExpenseById,
  validateExpenseInput,
} from './expenses.js';
import { setBudget, removeBudget, getBudgetStatus } from './budget.js';
import {
  computeMonthlySummary, computeCategoryBreakdown, computeMonthlyTrend, computeCategoryComparison,
} from './analytics.js';
import { applyFilters } from './filters.js';
import { renderCategoryDoughnut, renderTrendLine, renderCategoryBar } from './charts.js';
import {
  renderSummaryCards, renderBudgetPanel, renderInsights, renderCategoryPicker,
  setCategoryPickerSelection, renderMonthOptions, renderExpenseList, animateRowRemoval,
  showToast, openConfirmModal, celebrateUnderBudget, setButtonLoading,
} from './renderer.js';
import { debounce, todayISO, formatCurrency } from './utils.js';
import { CATEGORY_FILTER_ALL, CATEGORIES } from './constants.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function applyRuntimeBranding() {
  const config = window.APP_CONFIG || {};
  const appName = String(config.APP_NAME || 'LedgerFlow');
  const version = String(config.APP_VERSION || '1.0.0');
  const theme = String(config.APP_THEME || 'dark').toLowerCase();

  document.title = `${appName} — Take Control of Every Rupee`;
  document.body.dataset.theme = theme;

  const brand = $('#app-brand');
  if (brand && brand.firstChild && brand.firstChild.nodeType === Node.TEXT_NODE) {
    brand.firstChild.textContent = appName;
  }

  const footerMeta = $('#app-footer-meta');
  if (footerMeta) {
    footerMeta.innerHTML = `${appName} v${version} — built for HackWeek <span id="year-now">2026</span>. All data stays in your browser.`;
  }
}

// ---------------------------------------------------------------------
// Form state (add / edit)
// ---------------------------------------------------------------------
let editingId = null;
let selectedCategory = 'food';

function initForm() {
  const form = $('#expense-form');
  const catPicker = $('#cat-picker');
  const dateInput = $('#field-date');
  dateInput.value = todayISO();
  dateInput.max = todayISO();

  renderCategoryPicker(catPicker, selectedCategory, (id) => { selectedCategory = id; clearFieldError('category'); });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const payload = {
      title: $('#field-title').value,
      amount: $('#field-amount').value,
      category: selectedCategory,
      date: $('#field-date').value,
      note: $('#field-note').value,
    };
    const { valid, errors } = validateExpenseInput(payload);
    clearAllFieldErrors();
    if (!valid) {
      Object.entries(errors).forEach(([field, msg]) => setFieldError(field, msg));
      return;
    }

    const wasEditing = !!editingId;
    const submitBtn = form.querySelector('button[type="submit"]');
    const resolveLoading = setButtonLoading(submitBtn, wasEditing ? 'Saving…' : 'Adding…');

    // A brief, deliberate loading state (per the "premium interaction"
    // requirement) before the record is committed and the success toast
    // appears. State mutation + toast are wrapped in try/finally so the
    // button is always restored and the user always gets feedback, even
    // if something downstream (e.g. an analytics recalculation) fails.
    window.setTimeout(() => {
      try {
        if (wasEditing) {
          updateExpense(editingId, payload);
          showToast('Expense updated.', 'info');
          exitEditMode();
        } else {
          addExpense(payload);
          showToast('Expense added.', 'success');
        }
        form.reset();
        dateInput.value = todayISO();
        selectedCategory = 'food';
        setCategoryPickerSelection(catPicker, selectedCategory);
        $('#field-title').focus();
      } catch (err) {
        console.error('LedgerFlow: failed to save expense.', err);
        showToast('Something went wrong saving that expense.', 'error');
      } finally {
        resolveLoading();
      }
    }, 260);
  });

  $('#form-cancel-edit').addEventListener('click', () => {
    exitEditMode();
    form.reset();
    dateInput.value = todayISO();
    selectedCategory = 'food';
    setCategoryPickerSelection(catPicker, selectedCategory);
  });

  // Clear field error as the user retypes
  ['field-title', 'field-amount', 'field-date'].forEach((id) => {
    $(`#${id}`).addEventListener('input', () => clearFieldError(id.replace('field-', '')));
  });
}

function setFieldError(field, message) {
  const wrap = $(`#field-${field}`)?.closest('.field');
  if (!wrap) return;
  wrap.classList.add('has-error');
  const err = wrap.querySelector('.field__error');
  if (err) err.querySelector('span').textContent = message;
}
function clearFieldError(field) {
  const wrap = $(`#field-${field}`)?.closest('.field');
  wrap?.classList.remove('has-error');
}
function clearAllFieldErrors() {
  $$('.field').forEach((f) => f.classList.remove('has-error'));
}

function enterEditMode(id) {
  const expense = getExpenseById(id);
  if (!expense) return;
  editingId = id;
  selectedCategory = expense.category;
  $('#field-title').value = expense.title;
  $('#field-amount').value = expense.amount;
  $('#field-date').value = expense.date;
  $('#field-note').value = expense.note || '';
  setCategoryPickerSelection($('#cat-picker'), selectedCategory);

  $('#form-title').textContent = 'Edit expense';
  $('#form-sub').textContent = 'Update the details below.';
  $('#form-submit-label').textContent = 'Save changes';
  $('#form-cancel-edit').hidden = false;

  $('#expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#field-title').focus();
}

function exitEditMode() {
  editingId = null;
  $('#form-title').textContent = 'Add an expense';
  $('#form-sub').textContent = 'Record a new transaction in a few seconds.';
  $('#form-submit-label').textContent = 'Add expense';
  $('#form-cancel-edit').hidden = true;
}

// ---------------------------------------------------------------------
// Budget panel wiring
// ---------------------------------------------------------------------
function initBudgetPanel() {
  $('#budget-set-btn').addEventListener('click', () => openBudgetPrompt());
  $('#budget-edit-btn').addEventListener('click', () => openBudgetPrompt(state.budget?.amount));
  $('#budget-remove-btn').addEventListener('click', () => {
    openConfirmModal({
      title: 'Remove monthly budget?',
      body: 'You can set a new budget at any time. Your expense history will not be affected.',
      confirmLabel: 'Remove budget',
      onConfirm: () => { removeBudget(); showToast('Budget removed.', 'info'); },
    });
  });
}

function openBudgetPrompt(current) {
  const overlay = $('#budget-modal');
  const input = $('#budget-input');
  input.value = current ?? '';
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => input.focus(), 50);

  const form = $('#budget-form');
  const cleanup = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    form.removeEventListener('submit', onSubmit);
  };
  function onSubmit(ev) {
    ev.preventDefault();
    const val = Number(input.value);
    if (!val || val <= 0) {
      input.closest('.field').classList.add('has-error');
      return;
    }
    setBudget(val);
    showToast('Budget saved.', 'success');
    cleanup();
  }
  form.addEventListener('submit', onSubmit);
  $('#budget-modal-cancel').onclick = cleanup;
  overlay.onclick = (ev) => { if (ev.target === overlay) cleanup(); };
}

// ---------------------------------------------------------------------
// Toolbar (search / filter / sort)
// ---------------------------------------------------------------------
function initToolbar() {
  const searchInput = $('#search-input');
  const categorySelect = $('#filter-category');
  const monthSelect = $('#filter-month');
  const sortSelect = $('#sort-select');

  categorySelect.innerHTML = `<option value="${CATEGORY_FILTER_ALL}">All categories</option>` +
    CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('');

  const debouncedSearch = debounce((val) => setFilters({ search: val }), 200);
  searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
  categorySelect.addEventListener('change', (e) => setFilters({ category: e.target.value }));
  monthSelect.addEventListener('change', (e) => setFilters({ month: e.target.value }));
  sortSelect.addEventListener('change', (e) => setFilters({ sort: e.target.value }));
}

// ---------------------------------------------------------------------
// Full dashboard render — called on any state change
// ---------------------------------------------------------------------
let lastCelebratedMonth = state.prefs.lastCelebratedMonth;

function renderAll() {
  const monthNow = todayISO().slice(0, 7);
  const budgetStatus = getBudgetStatus(monthNow);
  const summary = computeMonthlySummary(monthNow);

  // Core dashboard state renders first and unconditionally. Analytics
  // charts are rendered last (see renderCharts below) and are fully
  // isolated from this section, so a charting problem can never prevent
  // the summary cards, budget panel, insights, filters, or expense list
  // from reflecting the latest state.
  renderSummaryCards({
    budgetAmount: budgetStatus.amount,
    hasBudget: budgetStatus.hasBudget,
    totalSpent: summary.total,
    remaining: budgetStatus.remaining,
    txCount: summary.count,
  });

  renderBudgetPanel(budgetStatus);
  renderInsights(summary);

  // Month filter options
  renderMonthOptions($('#filter-month'), getAvailableMonths(), state.filters.month);

  // Expense list (filtered) — always kept in sync with state on every render pass.
  const filtered = applyFilters(state.expenses, state.filters);
  renderExpenseList($('#expense-list'), filtered, {
    onEdit: (id) => enterEditMode(id),
    onDelete: (id) => confirmDelete(id),
  });

  maybeCelebrate(budgetStatus, monthNow);

  // Analytics charts render last and are individually guarded inside
  // charts.js (they no-op instead of throwing if Chart.js failed to load).
  renderCharts(monthNow);
}

function renderCharts(monthNow) {
  const breakdown = computeCategoryBreakdown(monthNow);
  const trend = computeMonthlyTrend(6);
  const comparison = computeCategoryComparison(6);

  const doughnutCanvas = $('#chart-doughnut');
  const lineCanvas = $('#chart-line');
  const barCanvas = $('#chart-bar');

  // Chart instances are created once (see initCharts) and reused for the
  // lifetime of the page; every render pass only updates their datasets.
  // The canvas itself is never hidden — only the empty-state overlay is
  // toggled — so Chart.js always measures a correctly-sized, visible
  // element and there is no hidden→visible timing race to work around.
  renderCategoryDoughnut(doughnutCanvas, breakdown);
  toggleEmptyOverlay($('#chart-doughnut-empty'), breakdown.length > 0);
  renderChartLegend('#doughnut-legend', breakdown);

  renderTrendLine(lineCanvas, trend);

  renderCategoryBar(barCanvas, comparison);
  toggleEmptyOverlay($('#chart-bar-empty'), comparison.length > 0);
}

function toggleEmptyOverlay(emptyStateEl, hasData) {
  if (!emptyStateEl) return;
  emptyStateEl.hidden = hasData;
}

/**
 * Create all three chart instances once, up front, with whatever data
 * currently exists (including empty datasets on a fresh install). This
 * must run before the first renderAll() so later calls only ever update
 * existing instances rather than creating them — matching the "reuse
 * instances, don't recreate" requirement and avoiding any construction-
 * time sizing race.
 */
function initCharts() {
  const monthNow = todayISO().slice(0, 7);
  renderCategoryDoughnut($('#chart-doughnut'), computeCategoryBreakdown(monthNow));
  renderTrendLine($('#chart-line'), computeMonthlyTrend(6));
  renderCategoryBar($('#chart-bar'), computeCategoryComparison(6));
}

function renderChartLegend(selector, data) {
  const el = $(selector);
  if (!el) return;
  el.innerHTML = data.slice(0, 6).map((d) => `
    <span class="chart-legend__item">
      <span class="chart-legend__swatch" style="background:${resolveColorForLegend(d.color)}"></span>
      ${d.label} · ${formatCurrency(d.value, { compact: true })}
    </span>`).join('');
}
function resolveColorForLegend(cssVarExpr) {
  const match = /var\((--[a-z0-9-]+)\)/i.exec(cssVarExpr || '');
  if (!match) return cssVarExpr;
  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim();
}

function confirmDelete(id) {
  const expense = getExpenseById(id);
  if (!expense) return;
  openConfirmModal({
    title: 'Delete this expense?',
    body: `"${expense.title}" (${formatCurrency(expense.amount)}) will be permanently removed.`,
    confirmLabel: 'Delete',
    onConfirm: () => {
      animateRowRemoval($('#expense-list'), id, () => {
        deleteExpense(id);
        showToast('Expense deleted.', 'warning');
      });
    },
  });
}

function maybeCelebrate(budgetStatus, monthNow) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const isLastDay = now.getDate() === daysInMonth;
  if (
    isLastDay &&
    budgetStatus.hasBudget &&
    budgetStatus.status === 'ok' &&
    lastCelebratedMonth !== monthNow
  ) {
    lastCelebratedMonth = monthNow;
    setPrefs({ lastCelebratedMonth: monthNow });
    celebrateUnderBudget();
  }
}

// ---------------------------------------------------------------------
// Navbar scroll behaviour
// ---------------------------------------------------------------------
function initNavbar() {
  const nav = $('#navbar');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  $('#hero-cta')?.addEventListener('click', () => {
    $('#expense-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#field-title').focus({ preventScroll: true });
  });
}

// ---------------------------------------------------------------------
// Hero ledger tape — signature ambient visual, built from real data when
// available, otherwise a tasteful placeholder tape.
// ---------------------------------------------------------------------
function initLedgerTape() {
  const scrollEl = $('#ledger-tape-scroll');
  if (!scrollEl) return;
  const sample = state.expenses.slice(0, 8);
  const placeholder = [
    { title: 'Coffee & pastry', category: 'food', amount: 240 },
    { title: 'Metro card top-up', category: 'transport', amount: 500 },
    { title: 'Electricity bill', category: 'bills', amount: 1840 },
    { title: 'Bookstore', category: 'education', amount: 620 },
    { title: 'Movie night', category: 'entertainment', amount: 450 },
    { title: 'Freelance payout', category: 'income', amount: 12000 },
  ];
  const rows = (sample.length ? sample : placeholder);
  const doubled = [...rows, ...rows]; // seamless loop
  scrollEl.innerHTML = doubled.map((e) => {
    const isIncome = e.category === 'income';
    return `<div class="ledger-tape__row">
      <span style="color:var(--ink-tertiary)">${(e.title || '').slice(0, 22)}</span>
      <span class="num" style="color:${isIncome ? 'var(--emerald)' : 'var(--ink-secondary)'}">${isIncome ? '+' : '−'}${formatCurrency(e.amount)}</span>
    </div>`;
  }).join('');
}

// ---------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------
function init() {
  applyRuntimeBranding();
  initNavbar();
  initForm();
  initBudgetPanel();
  initToolbar();
  initLedgerTape();
  initCharts();

  bus.on('expenses:changed', () => { renderAll(); initLedgerTape(); });
  bus.on('budget:changed', renderAll);
  bus.on('filters:changed', renderAll);

  renderAll();

  document.getElementById('year-now').textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', init);
