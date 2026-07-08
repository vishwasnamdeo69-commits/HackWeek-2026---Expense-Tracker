// ==========================================================================
// charts.js — Chart.js instance lifecycle & theming
// Chart is loaded globally via CDN <script> in index.html.
// ==========================================================================

import { formatCurrency } from './utils.js';

const INK_SECONDARY = '#A7ADC0';
const INK_TERTIARY = '#6C7288';
const GRID_LINE = 'rgba(255,255,255,0.06)';

let doughnutChart = null;
let lineChart = null;
let barChart = null;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function baseFont() {
  return { family: 'Inter, sans-serif', size: 11 };
}

/**
 * Chart.js is loaded from a CDN via a plain <script> tag in index.html.
 * If that request is blocked (ad-blocker, corporate firewall, offline),
 * slow, or fails for any other reason, `window.Chart` will be undefined.
 * Every render function below checks this first and no-ops instead of
 * throwing — a thrown error here previously propagated up through the
 * app's event emitter and silently aborted the rest of the dashboard
 * render (expense list, filters, toasts) whenever it happened.
 */
export function isChartLibAvailable() {
  return typeof window.Chart !== 'undefined';
}

/** Render/update the category breakdown doughnut chart. */
export function renderCategoryDoughnut(canvas, data) {
  if (!isChartLibAvailable() || !canvas) return null;
  try {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.value);
    const colors = data.map((d) => resolveColor(d.color));

    if (doughnutChart) {
      doughnutChart.data.labels = labels;
      doughnutChart.data.datasets[0].data = values;
      doughnutChart.data.datasets[0].backgroundColor = colors;
      doughnutChart.update();
      return doughnutChart;
    }

    doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#12151F',
          borderWidth: 3,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: reducedMotion() ? false : { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#171B27',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleFont: baseFont(),
            bodyFont: baseFont(),
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`,
            },
          },
        },
      },
    });
    return doughnutChart;
  } catch (err) {
    console.error('LedgerFlow: failed to render category doughnut chart.', err);
    return null;
  }
}

/** Render/update the monthly spending trend line chart. */
export function renderTrendLine(canvas, points) {
  if (!isChartLibAvailable() || !canvas) return null;
  try {
    const labels = points.map((p) => p.label);
    const values = points.map((p) => p.total);

    if (lineChart) {
      lineChart.data.labels = labels;
      lineChart.data.datasets[0].data = values;
      lineChart.update();
      return lineChart;
    }

    const ctx2d = canvas.getContext('2d');
    const gradient = ctx2d.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(109,107,255,0.35)');
    gradient.addColorStop(1, 'rgba(109,107,255,0)');

    lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#6D6BFF',
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 3,
          pointBackgroundColor: '#0D0F17',
          pointBorderColor: '#6D6BFF',
          pointBorderWidth: 2,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reducedMotion() ? false : { duration: 900, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#171B27',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleFont: baseFont(),
            bodyFont: baseFont(),
            padding: 10,
            callbacks: { label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: INK_TERTIARY, font: baseFont() },
          },
          y: {
            grid: { color: GRID_LINE },
            ticks: {
              color: INK_TERTIARY,
              font: baseFont(),
              callback: (v) => formatCurrency(v, { compact: true }),
            },
          },
        },
      },
    });
    return lineChart;
  } catch (err) {
    console.error('LedgerFlow: failed to render monthly trend chart.', err);
    return null;
  }
}

/** Render/update the category comparison bar chart. */
export function renderCategoryBar(canvas, data) {
  if (!isChartLibAvailable() || !canvas) return null;
  try {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.value);
    const colors = data.map((d) => resolveColor(d.color));

    if (barChart) {
      barChart.data.labels = labels;
      barChart.data.datasets[0].data = values;
      barChart.data.datasets[0].backgroundColor = colors;
      barChart.update();
      return barChart;
    }

    barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderRadius: 8,
          maxBarThickness: 40,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: reducedMotion() ? false : { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#171B27',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleFont: baseFont(),
            bodyFont: baseFont(),
            padding: 10,
            callbacks: { label: (ctx) => ` ${formatCurrency(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: INK_TERTIARY, font: baseFont() },
          },
          y: {
            grid: { color: GRID_LINE },
            ticks: {
              color: INK_TERTIARY,
              font: baseFont(),
              callback: (v) => formatCurrency(v, { compact: true }),
            },
          },
        },
      },
    });
    return barChart;
  } catch (err) {
    console.error('LedgerFlow: failed to render category comparison chart.', err);
    return null;
  }
}

/** Resolve a CSS variable reference like 'var(--cat-food)' to a hex color. */
function resolveColor(cssVarExpr) {
  if (!cssVarExpr) return INK_SECONDARY;
  const match = /var\((--[a-z0-9-]+)\)/i.exec(cssVarExpr);
  if (!match) return cssVarExpr;
  const value = getComputedStyle(document.documentElement).getPropertyValue(match[1]);
  return value ? value.trim() : INK_SECONDARY;
}

export function destroyAllCharts() {
  [doughnutChart, lineChart, barChart].forEach((c) => c && c.destroy());
  doughnutChart = lineChart = barChart = null;
}
