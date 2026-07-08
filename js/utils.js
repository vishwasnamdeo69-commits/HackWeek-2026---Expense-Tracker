// ==========================================================================
// utils.js — shared, side-effect-free helper functions
// ==========================================================================

import { CURRENCY } from './constants.js';

/** Generate a reasonably unique id without external deps. */
export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Format a number as INR currency, e.g. ₹1,240.50 */
export function formatCurrency(value, { compact = false } = {}) {
  const n = Number(value) || 0;
  if (compact) {
    return new Intl.NumberFormat(CURRENCY.locale, {
      style: 'currency',
      currency: CURRENCY.code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
}

/** Format a number with grouping only, no currency symbol. */
export function formatNumber(value) {
  return new Intl.NumberFormat(CURRENCY.locale).format(Number(value) || 0);
}

/** Format an ISO date string as "12 Jul 2026" */
export function formatDate(iso, opts = {}) {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: opts.year !== false ? 'numeric' : undefined,
  }).format(d);
}

/** Return YYYY-MM key for a given ISO date string */
export function monthKey(iso) {
  return iso.slice(0, 7);
}

/** Human label for a YYYY-MM key, e.g. "Jul 2026" */
export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(d);
}

export function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

/** Debounce a function by a given delay in ms. */
export function debounce(fn, delay = 220) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/** Escape a string for safe HTML interpolation. */
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Animate a numeric text value counting from its current displayed value
 * (or 0) up to `to`, writing formatted output via `formatter`.
 * Respects prefers-reduced-motion by jumping instantly.
 */
export function animateCount(el, to, { duration = 700, formatter = formatNumber, from } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = typeof from === 'number' ? from : 0;
  if (reduced) {
    el.textContent = formatter(to);
    return;
  }
  const startTime = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function tick(now) {
    const elapsed = now - startTime;
    const p = clamp(elapsed / duration, 0, 1);
    const val = start + (to - start) * ease(p);
    el.textContent = formatter(val);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = formatter(to);
  }
  requestAnimationFrame(tick);
}

/**
 * Simple pub/sub emitter used by state.js.
 * Each listener is invoked in isolation: if one throws (e.g. a renderer
 * error), the exception is logged and swallowed rather than propagating
 * back through emit() into the code that triggered the state change
 * (addExpense, updateExpense, etc.) and past any other listeners. Without
 * this isolation, a single failing subscriber could silently abort the
 * rest of the render pipeline and any caller code that runs after the
 * emit() call (e.g. a success toast shown right after addExpense()).
 */
export class Emitter {
  constructor() { this._events = new Map(); }
  on(evt, fn) {
    if (!this._events.has(evt)) this._events.set(evt, new Set());
    this._events.get(evt).add(fn);
    return () => this._events.get(evt)?.delete(fn);
  }
  emit(evt, payload) {
    this._events.get(evt)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`LedgerFlow: listener for "${evt}" threw and was isolated.`, err);
      }
    });
  }
}
