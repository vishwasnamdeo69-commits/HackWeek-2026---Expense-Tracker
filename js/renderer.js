// ==========================================================================
// renderer.js — all DOM writes live here. Pure-ish: takes data, mutates DOM.
// ==========================================================================

import { CATEGORIES, CATEGORY_MAP, ICONS } from './constants.js';
import {
  formatCurrency, formatDate, escapeHtml, animateCount, formatNumber,
} from './utils.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

// ---------------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------------
export function renderSummaryCards({ budgetAmount, hasBudget, totalSpent, remaining, txCount }) {
  animateStatValue('#stat-budget', hasBudget ? budgetAmount : 0, formatCurrency);
  animateStatValue('#stat-spent', totalSpent, formatCurrency);
  animateStatValue('#stat-remaining', hasBudget ? remaining : 0, formatCurrency);
  animateStatValue('#stat-count', txCount, (v) => formatNumber(Math.round(v)));

  const remainingCard = $('#card-remaining');
  if (remainingCard) {
    remainingCard.classList.toggle('stat-card--red', hasBudget && remaining < 0);
    remainingCard.classList.toggle('stat-card--emerald', !hasBudget || remaining >= 0);
  }
  const budgetFoot = $('#stat-budget-foot');
  if (budgetFoot) budgetFoot.textContent = hasBudget ? 'Set for this month' : 'No budget set yet';
}

function animateStatValue(selector, value, formatter) {
  const el = $(selector);
  if (!el) return;
  const prev = Number(el.dataset.rawValue || 0);
  el.dataset.rawValue = value;
  animateCount(el, value, { formatter, from: prev });
}

// ---------------------------------------------------------------------
// Budget panel
// ---------------------------------------------------------------------
const RING_RADIUS = 58;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function renderBudgetPanel(budgetStatus) {
  const panel = $('#budget-panel');
  if (!panel) return;
  const { hasBudget, amount, spent, remaining, utilization, status } = budgetStatus;

  const withBudgetEl = $('#budget-with');
  const emptyEl = $('#budget-empty');

  if (!hasBudget) {
    withBudgetEl.hidden = true;
    emptyEl.hidden = false;
    return;
  }
  withBudgetEl.hidden = false;
  emptyEl.hidden = true;

  const pct = Math.min(utilization, 1);
  const offset = RING_CIRCUMFERENCE * (1 - pct);
  const ringFill = $('#ring-fill');
  ringFill.style.strokeDashoffset = offset;

  const colorVar = status === 'danger' ? 'var(--red)' : status === 'warning' ? 'var(--amber)' : 'var(--emerald)';
  ringFill.style.stroke = colorVar;

  $('#ring-pct').textContent = `${Math.round(utilization * 100)}%`;
  $('#budget-amount-val').textContent = formatCurrency(amount);
  $('#budget-spent-val').textContent = formatCurrency(spent);
  const remainingVal = $('#budget-remaining-val');
  remainingVal.textContent = formatCurrency(remaining);
  remainingVal.style.color = remaining < 0 ? 'var(--red)' : 'var(--ink-primary)';

  const alertBox = $('#budget-alert');
  if (status === 'danger') {
    alertBox.hidden = false;
    alertBox.className = 'budget-alert budget-alert--red';
    alertBox.innerHTML = `${icon('warning', 16)}<span>You've exceeded this month's budget by ${formatCurrency(Math.abs(remaining))}.</span>`;
  } else if (status === 'warning') {
    alertBox.hidden = false;
    alertBox.className = 'budget-alert budget-alert--amber';
    alertBox.innerHTML = `${icon('warning', 16)}<span>You're at ${Math.round(utilization * 100)}% of your budget — approaching the limit.</span>`;
  } else {
    alertBox.hidden = true;
  }
}

// ---------------------------------------------------------------------
// Monthly insight cards
// ---------------------------------------------------------------------
export function renderInsights(summary) {
  $('#insight-total').textContent = formatCurrency(summary.total);
  $('#insight-highest-cat').textContent = summary.highestCategory
    ? CATEGORY_MAP[summary.highestCategory]?.label || summary.highestCategory
    : '—';
  $('#insight-avg-daily').textContent = formatCurrency(summary.avgDaily);
  $('#insight-largest').textContent = summary.largest
    ? formatCurrency(summary.largest.amount)
    : '—';
  $('#insight-largest-sub').textContent = summary.largest ? summary.largest.title : 'No expenses yet';
  $('#insight-count').textContent = formatNumber(summary.count);
}

// ---------------------------------------------------------------------
// Category picker (inside the expense form)
// ---------------------------------------------------------------------
export function renderCategoryPicker(container, selectedId, onSelect) {
  container.innerHTML = CATEGORIES.map((c) => `
    <button type="button" class="cat-chip" data-cat="${c.id}" aria-pressed="${c.id === selectedId}">
      <span class="cat-chip__icon" style="background:color-mix(in srgb, ${c.color} 18%, transparent); color:${c.color}">${icon(c.id, 15)}</span>
      <span>${c.label}</span>
    </button>
  `).join('');
  $$('.cat-chip', container).forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.cat-chip', container).forEach((b) => b.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');
      onSelect(btn.dataset.cat);
    });
  });
}

export function setCategoryPickerSelection(container, id) {
  $$('.cat-chip', container).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === id)));
}

// ---------------------------------------------------------------------
// Month filter select — populate options dynamically
// ---------------------------------------------------------------------
export function renderMonthOptions(selectEl, months, selected) {
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="all">All months</option>' + months.map((m) => {
    const [y, mo] = m.split('-').map(Number);
    const label = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(y, mo - 1, 1));
    return `<option value="${m}">${label}</option>`;
  }).join('');
  selectEl.value = selected || current || 'all';
}

// ---------------------------------------------------------------------
// Expense list
// ---------------------------------------------------------------------
export function renderExpenseList(container, expenses, { onEdit, onDelete }) {
  if (!expenses.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">${icon('receipt', 26)}</div>
        <div class="empty-state__title">No expenses match yet</div>
        <p>Add your first expense or adjust your filters to see records here.</p>
      </div>`;
    return;
  }

  container.innerHTML = expenses.map((e) => rowTemplate(e)).join('');

  $$('.expense-row', container).forEach((row) => {
    const id = row.dataset.id;
    row.querySelector('[data-action="edit"]').addEventListener('click', () => onEdit(id));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => onDelete(id));
  });
}

function rowTemplate(e) {
  const cat = CATEGORY_MAP[e.category] || CATEGORY_MAP.other;
  const isIncome = e.category === 'income';
  return `
    <div class="expense-row row-enter" data-id="${e.id}">
      <div class="expense-row__icon" style="background:color-mix(in srgb, ${cat.color} 16%, transparent); color:${cat.color}">
        ${icon(cat.id, 18)}
      </div>
      <div class="expense-row__main">
        <div class="expense-row__title">${escapeHtml(e.title)}</div>
        <div class="expense-row__meta">
          <span>${cat.label}</span>
          ${e.note ? `<span class="dot"></span><span>${escapeHtml(e.note)}</span>` : ''}
        </div>
      </div>
      <div class="expense-row__date">${formatDate(e.date)}</div>
      <div class="expense-row__amount ${isIncome ? 'expense-row__amount--income' : ''} num">${isIncome ? '+' : '−'}${formatCurrency(e.amount)}</div>
      <div class="expense-row__actions">
        <button class="icon-btn" data-action="edit" aria-label="Edit ${escapeHtml(e.title)}">${icon('edit', 15)}</button>
        <button class="icon-btn icon-btn--danger" data-action="delete" aria-label="Delete ${escapeHtml(e.title)}">${icon('trash', 15)}</button>
      </div>
    </div>`;
}

export function animateRowRemoval(container, id, callback) {
  const row = container.querySelector(`.expense-row[data-id="${id}"]`);
  if (!row) { callback(); return; }
  row.classList.add('row-exit');
  row.addEventListener('animationend', callback, { once: true });
  setTimeout(callback, 400); // safety net if animation events are skipped (reduced motion)
}

// ---------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------
export function showToast(message, type = 'info') {
  const stack = $('#toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  // role="status" + the stack's aria-live="polite" together ensure screen
  // readers announce each toast as it's inserted, without needing focus.
  toast.setAttribute('role', 'status');
  toast.style.animation = 'toastIn 260ms cubic-bezier(0.34,1.56,0.64,1) both';
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'x' : type === 'warning' ? 'trash' : 'sparkle';
  toast.innerHTML = `<span class="toast__icon">${icon(iconName, 15)}</span><span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 220ms ease, transform 220ms ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(8px)';
    setTimeout(() => toast.remove(), 240);
  }, 3200);
}

/**
 * Briefly put a submit button into a loading state, then resolve it back
 * to normal. Used to give the "Add expense" action a moment of visible
 * feedback before the success toast appears, per the premium-interaction
 * requirement — never longer than a few hundred ms so it never feels slow.
 */
export function setButtonLoading(btn, loadingLabel = 'Saving…') {
  if (!btn) return () => {};
  const labelEl = btn.querySelector('[id$="-label"]') || btn;
  const originalHTML = btn.innerHTML;
  const originalText = labelEl.textContent;
  btn.disabled = true;
  btn.classList.add('is-loading');
  labelEl.textContent = loadingLabel;
  return () => {
    btn.disabled = false;
    btn.classList.remove('is-loading');
    if (labelEl === btn) btn.innerHTML = originalHTML;
    else labelEl.textContent = originalText;
  };
}

// ---------------------------------------------------------------------
// Confirm modal (generic, reused for delete-expense / remove-budget)
// ---------------------------------------------------------------------
export function openConfirmModal({ title, body, confirmLabel = 'Confirm', danger = true, onConfirm }) {
  const overlay = $('#confirm-modal');
  $('#confirm-modal-title').textContent = title;
  $('#confirm-modal-body').textContent = body;
  const confirmBtn = $('#confirm-modal-confirm');
  confirmBtn.textContent = confirmLabel;
  confirmBtn.className = danger ? 'btn btn--danger' : 'btn btn--primary';

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');

  const cleanup = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    confirmBtn.removeEventListener('click', handleConfirm);
  };
  const handleConfirm = () => { cleanup(); onConfirm(); };

  confirmBtn.addEventListener('click', handleConfirm);
  $('#confirm-modal-cancel').onclick = cleanup;
  overlay.onclick = (ev) => { if (ev.target === overlay) cleanup(); };

  confirmBtn.focus();
}

// ---------------------------------------------------------------------
// Confetti celebration (under-budget month-end delight moment)
// ---------------------------------------------------------------------
export function celebrateUnderBudget() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#6D6BFF', '#34D399', '#4FD9E8', '#F5B858', '#9B7BFF'];
  for (let i = 0; i < 60; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty('--fall-dur', `${1.8 + Math.random() * 1.6}s`);
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
  showToast('Nice work — you stayed under budget this month!', 'success');
}

export { icon, $, $$ };
