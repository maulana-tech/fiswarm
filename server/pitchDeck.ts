/**
 * pitchDeck.ts — Server-side pitch deck generator for FiSwarm
 *
 * Generates a 9-slide HTML presentation from simulation + report data,
 * then renders it to PDF using Puppeteer with the system Chromium binary.
 *
 * Slides:
 *   1. Cover
 *   2. Ringkasan Eksekutif
 *   3. KPI Keuangan
 *   4. Tren Revenue vs Expenses (bar chart via SVG)
 *   5. Proyeksi Cashflow (area chart via SVG)
 *   6. Peringatan Risiko
 *   7. Wawasan Agen Swarm
 *   8. Rekomendasi Strategis
 *   9. Penutup
 */

import puppeteer from "puppeteer-core";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ForecastMonth {
  month: string;
  income: number;
  expense: number;
  net: number;
  confidence: number;
}

export interface RiskAlert {
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
}

export interface AgentInsights {
  owner?: string;
  supplier?: string;
  customer?: string;
  bank?: string;
}

export interface PitchDeckInput {
  businessName: string;
  reportTitle: string;
  generatedDate: string;
  seedText: string;
  forecastMonths: number;
  riskLevel: string;
  forecast: ForecastMonth[];
  riskAlerts: RiskAlert[];
  agentInsights: AgentInsights;
  executiveSummary: string;
  recommendations: string[];
  kpis: {
    totalIncome: number;
    totalExpense: number;
    netCashflow: number;
    avgMonthlyIncome: number;
    avgMonthlyExpense: number;
    avgConfidence: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function severityColor(s: string): string {
  if (s === "critical") return "#ef4444";
  if (s === "high") return "#f97316";
  if (s === "medium") return "#eab308";
  return "#22c55e";
}

function severityLabel(s: string): string {
  if (s === "critical") return "CRITICAL";
  if (s === "high") return "HIGH";
  if (s === "medium") return "MEDIUM";
  return "LOW";
}

function riskLevelColor(r: string): string {
  if (r === "critical") return "#ef4444";
  if (r === "high") return "#f97316";
  if (r === "medium") return "#eab308";
  return "#22c55e";
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────

function buildBarChart(forecast: ForecastMonth[]): string {
  const W = 700, H = 220, PAD = 50, BAR_GAP = 8;
  const n = forecast.length;
  const maxVal = Math.max(...forecast.flatMap((f) => [f.income, f.expense]), 1);
  const slotW = (W - PAD * 2) / n;
  const barW = (slotW - BAR_GAP * 3) / 2;
  const chartH = H - PAD - 20;

  const bars = forecast.map((f, i) => {
    const x = PAD + i * slotW + BAR_GAP;
    const incH = (f.income / maxVal) * chartH;
    const expH = (f.expense / maxVal) * chartH;
    const incY = H - PAD - incH;
    const expY = H - PAD - expH;
    const labelX = x + slotW / 2 - BAR_GAP;
    return `
      <rect x="${x}" y="${incY}" width="${barW}" height="${incH}" fill="#00d4aa" rx="2" opacity="0.85"/>
      <rect x="${x + barW + BAR_GAP}" y="${expY}" width="${barW}" height="${expH}" fill="#ff6b6b" rx="2" opacity="0.85"/>
      <text x="${labelX}" y="${H - PAD + 14}" text-anchor="middle" font-size="9" fill="#888">${f.month.slice(5)}</text>
    `;
  }).join("");

  const yLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
    const y = H - PAD - pct * chartH;
    const val = formatUSD(pct * maxVal);
    return `
      <line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="#333" stroke-width="1"/>
      <text x="${PAD - 4}" y="${y + 4}" text-anchor="end" font-size="8" fill="#666">${val}</text>
    `;
  }).join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:220px">
    ${yLines}${bars}
    <text x="${PAD + 8}" y="16" font-size="10" fill="#00d4aa">■ Revenue</text>
    <text x="${PAD + 110}" y="16" font-size="10" fill="#ff6b6b">■ Expenses</text>
  </svg>`;
}

// ─── SVG Area Chart ────────────────────────────────────────────────────────────

function buildAreaChart(forecast: ForecastMonth[]): string {
  const W = 700, H = 200, PAD = 50;
  const n = forecast.length;
  if (n === 0) return "";
  const nets = forecast.map((f) => f.net);
  const minNet = Math.min(...nets);
  const maxNet = Math.max(...nets, 1);
  const range = maxNet - minNet || 1;
  const chartH = H - PAD - 20;

  const xStep = (W - PAD * 2) / Math.max(n - 1, 1);

  const points = forecast.map((f, i) => {
    const x = PAD + i * xStep;
    const y = H - PAD - ((f.net - minNet) / range) * chartH;
    return { x, y, f };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M ${points[0].x},${H - PAD} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x},${H - PAD} Z`;

  const dots = points.map((p) => `
    <circle cx="${p.x}" cy="${p.y}" r="4" fill="${p.f.net >= 0 ? "#00d4aa" : "#ff6b6b"}" stroke="#0a0a0a" stroke-width="1.5"/>
    <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="8" fill="${p.f.net >= 0 ? "#00d4aa" : "#ff6b6b"}">${formatUSD(p.f.net)}</text>
  `).join("");

  const labels = points.map((p) => `
    <text x="${p.x}" y="${H - PAD + 14}" text-anchor="middle" font-size="9" fill="#888">${p.f.month.slice(5)}</text>
  `).join("");

  // Zero line
  const zeroY = H - PAD - ((0 - minNet) / range) * chartH;
  const zeroLine = minNet < 0 ? `<line x1="${PAD}" y1="${zeroY}" x2="${W - PAD}" y2="${zeroY}" stroke="#555" stroke-width="1" stroke-dasharray="4"/>` : "";

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
    <defs>
      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00d4aa" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#00d4aa" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    ${zeroLine}
    <path d="${areaPath}" fill="url(#netGrad)"/>
    <polyline points="${polyline}" fill="none" stroke="#00d4aa" stroke-width="2"/>
    ${dots}${labels}
  </svg>`;
}

// ─── Slide HTML builder ────────────────────────────────────────────────────────

function slide(index: number, total: number, content: string, accent = "#00d4aa"): string {
  return `
  <div class="slide" id="slide-${index}">
    <div class="slide-number">${index} / ${total}</div>
    ${content}
    <div class="slide-footer">FiSwarm — SME Financial Intelligence</div>
  </div>`;
}

export function buildPitchDeckHTML(data: PitchDeckInput): string {
  const TOTAL = 9;
  const {
    businessName, reportTitle, generatedDate,
    forecast, riskAlerts, agentInsights,
    executiveSummary, recommendations, kpis, riskLevel, forecastMonths,
  } = data;

  const barChart = buildBarChart(forecast);
  const areaChart = buildAreaChart(forecast);

  // ── Slide 1: Cover ──────────────────────────────────────────────────────────
  const s1 = slide(1, TOTAL, `
    <div class="cover-slide">
      <div class="cover-badge">BUSINESS FINANCIAL REPORT</div>
      <h1 class="cover-title">${businessName}</h1>
      <p class="cover-subtitle">${reportTitle}</p>
      <div class="cover-meta">
        <span>Generated: ${generatedDate}</span>
        <span class="sep">|</span>
        <span>Forecast: ${forecastMonths} Bulan</span>
        <span class="sep">|</span>
        <span style="color:${riskLevelColor(riskLevel)}">Risk: ${riskLevel.toUpperCase()}</span>
      </div>
      <div class="cover-brand">FiSwarm · Swarm AI Financial Intelligence</div>
    </div>
  `);

  // ── Slide 2: Ringkasan Eksekutif ────────────────────────────────────────────
  const s2 = slide(2, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">02 — EXECUTIVE SUMMARY</div>
      <h2 class="slide-title">Financial Overview</h2>
      <div class="exec-summary">${executiveSummary.replace(/\n/g, "<br/>")}</div>
      <div class="kpi-row">
        <div class="kpi-mini">
          <div class="kpi-mini-val" style="color:#00d4aa">${formatUSD(kpis.totalIncome)}</div>
          <div class="kpi-mini-label">Total Projected Revenue</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-val" style="color:#ff6b6b">${formatUSD(kpis.totalExpense)}</div>
          <div class="kpi-mini-label">Total Projected Expenses</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-val" style="color:${kpis.netCashflow >= 0 ? "#00d4aa" : "#ff6b6b"}">${formatUSD(kpis.netCashflow)}</div>
          <div class="kpi-mini-label">Projected Net Cashflow</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-mini-val" style="color:#a78bfa">${kpis.avgConfidence.toFixed(0)}%</div>
          <div class="kpi-mini-label">Avg AI Confidence</div>
        </div>
      </div>
    </div>
  `);

  // ── Slide 3: KPI Overview ───────────────────────────────────────────────────
  const s3 = slide(3, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">03 — KEY FINANCIAL INDICATORS</div>
      <h2 class="slide-title">Key Business KPIs</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#00d4aa22;color:#00d4aa">↑</div>
          <div class="kpi-val" style="color:#00d4aa">${formatUSD(kpis.avgMonthlyIncome)}</div>
          <div class="kpi-lbl">Avg Revenue/Month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#ff6b6b22;color:#ff6b6b">↓</div>
          <div class="kpi-val" style="color:#ff6b6b">${formatUSD(kpis.avgMonthlyExpense)}</div>
          <div class="kpi-lbl">Avg Expenses/Month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:${kpis.netCashflow >= 0 ? "#00d4aa22" : "#ff6b6b22"};color:${kpis.netCashflow >= 0 ? "#00d4aa" : "#ff6b6b"}">≈</div>
          <div class="kpi-val" style="color:${kpis.netCashflow >= 0 ? "#00d4aa" : "#ff6b6b"}">${formatUSD(kpis.netCashflow / Math.max(forecastMonths, 1))}</div>
          <div class="kpi-lbl">Net Cashflow/Month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#a78bfa22;color:#a78bfa">AI</div>
          <div class="kpi-val" style="color:#a78bfa">${kpis.avgConfidence.toFixed(0)}%</div>
          <div class="kpi-lbl">Tingkat Kepercayaan Simulasi</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:${riskLevelColor(riskLevel)}22;color:${riskLevelColor(riskLevel)}">!</div>
          <div class="kpi-val" style="color:${riskLevelColor(riskLevel)}">${riskLevel.toUpperCase()}</div>
          <div class="kpi-lbl">Level Risiko Keseluruhan</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fbbf2422;color:#fbbf24">⚑</div>
          <div class="kpi-val" style="color:#fbbf24">${riskAlerts.length}</div>
          <div class="kpi-lbl">Jumlah Peringatan Risiko</div>
        </div>
      </div>
    </div>
  `);

  // ── Slide 4: Income vs Expense Bar Chart ────────────────────────────────────
  const s4 = slide(4, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">04 — ANALISIS PENDAPATAN & PENGELUARAN</div>
      <h2 class="slide-title">Tren Bulanan: Revenue vs Expenses</h2>
      <div class="chart-wrap">${barChart}</div>
      <div class="chart-insight">
        <span style="color:#00d4aa">▲ Revenue tertinggi:</span>
        ${formatUSD(Math.max(...forecast.map((f) => f.income)))} &nbsp;|&nbsp;
        <span style="color:#ff6b6b">▼ Expenses tertinggi:</span>
        ${formatUSD(Math.max(...forecast.map((f) => f.expense)))}
      </div>
    </div>
  `);

  // ── Slide 5: Cashflow Forecast Area Chart ───────────────────────────────────
  const s5 = slide(5, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">05 — CASHFLOW PROJECTION</div>
      <h2 class="slide-title">Net Cashflow ${forecastMonths} Bulan ke Depan</h2>
      <div class="chart-wrap">${areaChart}</div>
      <div class="forecast-table">
        <table>
          <thead><tr><th>Bulan</th><th>Revenue</th><th>Expenses</th><th>Net</th><th>Kepercayaan</th></tr></thead>
          <tbody>
            ${forecast.map((f) => `
              <tr>
                <td>${f.month}</td>
                <td style="color:#00d4aa">${formatUSD(f.income)}</td>
                <td style="color:#ff6b6b">${formatUSD(f.expense)}</td>
                <td style="color:${f.net >= 0 ? "#00d4aa" : "#ff6b6b"};font-weight:600">${formatUSD(f.net)}</td>
                <td>
                  <div class="conf-bar"><div class="conf-fill" style="width:${f.confidence}%;background:${f.confidence > 70 ? "#00d4aa" : f.confidence > 40 ? "#eab308" : "#ff6b6b"}"></div></div>
                  ${f.confidence}%
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `);

  // ── Slide 6: Risk Alerts ────────────────────────────────────────────────────
  const s6 = slide(6, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">06 — RISK ALERTS</div>
      <h2 class="slide-title">Identifikasi Risiko Bisnis</h2>
      ${riskAlerts.length === 0
        ? `<div class="no-risk">No risk alerts yang terdeteksi. Kondisi keuangan dalam keadaan baik.</div>`
        : `<div class="risk-list">
          ${riskAlerts.map((a) => `
            <div class="risk-item" style="border-left:3px solid ${severityColor(a.severity)}">
              <div class="risk-header">
                <span class="risk-badge" style="background:${severityColor(a.severity)}22;color:${severityColor(a.severity)}">${severityLabel(a.severity)}</span>
                <span class="risk-title">${a.title}</span>
              </div>
              <p class="risk-desc">${a.description}</p>
            </div>
          `).join("")}
        </div>`
      }
    </div>
  `);

  // ── Slide 7: Agent Insights ─────────────────────────────────────────────────
  const agentList = [
    { key: "owner", label: "Owner", color: "#00d4aa", icon: "O" },
    { key: "supplier", label: "Supplier", color: "#a78bfa", icon: "S" },
    { key: "customer", label: "Customer", color: "#fbbf24", icon: "C" },
    { key: "bank", label: "Bank", color: "#60a5fa", icon: "B" },
  ] as const;

  const s7 = slide(7, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">07 — SWARM AGENT INSIGHTS AI</div>
      <h2 class="slide-title">Multi-Agent Perspectives</h2>
      <div class="agent-grid">
        ${agentList.map((a) => `
          <div class="agent-card" style="border-top:2px solid ${a.color}">
            <div class="agent-header">
              <div class="agent-avatar" style="background:${a.color}22;color:${a.color}">${a.icon}</div>
              <span class="agent-name" style="color:${a.color}">${a.label}</span>
            </div>
            <p class="agent-insight">${(agentInsights[a.key] ?? "Data tidak tersedia.").substring(0, 200)}${(agentInsights[a.key] ?? "").length > 200 ? "..." : ""}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `);

  // ── Slide 8: Recommendations ────────────────────────────────────────────────
  const s8 = slide(8, TOTAL, `
    <div class="content-slide">
      <div class="slide-label">08 — STRATEGIC RECOMMENDATIONS</div>
      <h2 class="slide-title">Langkah Aksi yang Disarankan</h2>
      <div class="rec-list">
        ${recommendations.map((r, i) => `
          <div class="rec-item">
            <div class="rec-num" style="background:#00d4aa22;color:#00d4aa">${String(i + 1).padStart(2, "0")}</div>
            <p class="rec-text">${r}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `);

  // ── Slide 9: Closing ────────────────────────────────────────────────────────
  const s9 = slide(9, TOTAL, `
    <div class="cover-slide">
      <div class="cover-badge">THANK YOU</div>
      <h1 class="cover-title" style="font-size:2.4rem">This report was automatically generated by FiSwarm</h1>
      <p class="cover-subtitle">Powered by FiSwarm Swarm AI — multi-agent simulation for accurate and actionable SME financial predictions.</p>
      <div class="cover-meta">
        <span>${businessName}</span>
        <span class="sep">|</span>
        <span>${generatedDate}</span>
        <span class="sep">|</span>
        <span style="color:${riskLevelColor(riskLevel)}">Risk: ${riskLevel.toUpperCase()}</span>
      </div>
      <div class="cover-brand">FiSwarm · SME Financial Intelligence</div>
    </div>
  `);

  // ── Full HTML ───────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${reportTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    font-family: 'Inter', sans-serif;
    background: #050505;
    color: #e8e8e8;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  .slide {
    width: 1280px;
    height: 720px;
    background: #0a0a0a;
    border: 1px solid #1a1a1a;
    position: relative;
    padding: 52px 64px 48px;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  .slide::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #00d4aa, #0066ff, #a78bfa);
  }

  .slide-number {
    position: absolute;
    top: 18px; right: 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #444;
    letter-spacing: 0.05em;
  }

  .slide-footer {
    position: absolute;
    bottom: 18px; left: 64px;
    font-size: 10px;
    color: #333;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ── Cover ── */
  .cover-slide {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    flex: 1;
  }

  .cover-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.18em;
    color: #00d4aa;
    text-transform: uppercase;
    border: 1px solid #00d4aa44;
    padding: 4px 12px;
    border-radius: 2px;
  }

  .cover-title {
    font-size: 3.2rem;
    font-weight: 800;
    line-height: 1.1;
    color: #ffffff;
    max-width: 800px;
  }

  .cover-subtitle {
    font-size: 1.1rem;
    color: #888;
    max-width: 680px;
    line-height: 1.6;
  }

  .cover-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 0.85rem;
    color: #666;
    font-family: 'JetBrains Mono', monospace;
  }

  .cover-meta .sep { color: #333; }

  .cover-brand {
    position: absolute;
    bottom: 48px; right: 64px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #333;
    letter-spacing: 0.1em;
  }

  /* ── Content slides ── */
  .content-slide {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex: 1;
  }

  .slide-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    color: #00d4aa;
    text-transform: uppercase;
  }

  .slide-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.2;
  }

  /* ── KPI row (slide 2) ── */
  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-top: auto;
  }

  .kpi-mini {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 6px;
    padding: 16px;
    text-align: center;
  }

  .kpi-mini-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.3rem;
    font-weight: 700;
  }

  .kpi-mini-label {
    font-size: 0.7rem;
    color: #666;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── KPI grid (slide 3) ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    flex: 1;
  }

  .kpi-card {
    background: #111;
    border: 1px solid #1e1e1e;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .kpi-icon {
    width: 36px; height: 36px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
    font-weight: 700;
  }

  .kpi-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .kpi-lbl {
    font-size: 0.72rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  /* ── Charts ── */
  .chart-wrap {
    background: #0d0d0d;
    border: 1px solid #1a1a1a;
    border-radius: 6px;
    padding: 16px;
    flex: 1;
  }

  .chart-insight {
    font-size: 0.78rem;
    color: #666;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Forecast table ── */
  .forecast-table {
    overflow: auto;
    max-height: 200px;
  }

  .forecast-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.78rem;
  }

  .forecast-table th {
    text-align: left;
    padding: 6px 10px;
    color: #555;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #1a1a1a;
  }

  .forecast-table td {
    padding: 6px 10px;
    border-bottom: 1px solid #111;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.75rem;
  }

  .conf-bar {
    display: inline-block;
    width: 48px;
    height: 4px;
    background: #1a1a1a;
    border-radius: 2px;
    vertical-align: middle;
    margin-right: 4px;
    overflow: hidden;
  }

  .conf-fill {
    height: 100%;
    border-radius: 2px;
  }

  /* ── Risk ── */
  .risk-list { display: flex; flex-direction: column; gap: 12px; flex: 1; }

  .risk-item {
    background: #0d0d0d;
    border: 1px solid #1a1a1a;
    border-radius: 6px;
    padding: 14px 16px;
  }

  .risk-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .risk-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 2px 8px;
    border-radius: 2px;
  }

  .risk-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e0e0e0;
  }

  .risk-desc {
    font-size: 0.78rem;
    color: #777;
    line-height: 1.5;
  }

  .no-risk {
    background: #00d4aa11;
    border: 1px solid #00d4aa33;
    border-radius: 6px;
    padding: 20px;
    color: #00d4aa;
    font-size: 0.9rem;
    text-align: center;
    margin-top: 20px;
  }

  /* ── Agents ── */
  .agent-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    flex: 1;
  }

  .agent-card {
    background: #0d0d0d;
    border: 1px solid #1a1a1a;
    border-radius: 6px;
    padding: 16px;
  }

  .agent-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .agent-avatar {
    width: 32px; height: 32px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .agent-name {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .agent-insight {
    font-size: 0.78rem;
    color: #888;
    line-height: 1.55;
  }

  /* ── Recommendations ── */
  .rec-list { display: flex; flex-direction: column; gap: 14px; flex: 1; }

  .rec-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #0d0d0d;
    border: 1px solid #1a1a1a;
    border-radius: 6px;
    padding: 14px 16px;
  }

  .rec-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    width: 36px; height: 36px;
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .rec-text {
    font-size: 0.85rem;
    color: #ccc;
    line-height: 1.55;
    padding-top: 6px;
  }

  /* ── Executive summary ── */
  .exec-summary {
    background: #0d0d0d;
    border: 1px solid #1a1a1a;
    border-left: 3px solid #00d4aa;
    border-radius: 6px;
    padding: 16px 20px;
    font-size: 0.88rem;
    color: #bbb;
    line-height: 1.7;
  }

  @media print {
    body { background: #050505; }
    .slide { page-break-after: always; }
  }
</style>
</head>
<body>
${s1}${s2}${s3}${s4}${s5}${s6}${s7}${s8}${s9}
</body>
</html>`;
}

// ─── PDF export ────────────────────────────────────────────────────────────────

export async function renderPitchDeckToPDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdf = await page.pdf({
      width: "1280px",
      height: "720px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
