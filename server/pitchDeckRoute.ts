/**
 * pitchDeckRoute.ts — Express route for pitch deck PDF generation
 *
 * GET /api/pitch-deck/:reportId
 *   - Authenticates via session cookie (same JWT as tRPC)
 *   - Fetches report + simulation data
 *   - Generates HTML pitch deck
 *   - Renders to PDF via Puppeteer
 *   - Streams PDF as download
 */

import type { Express, Request, Response } from "express";
import { getReportById } from "./db";
import { getSimulationById } from "./db";
import { buildPitchDeckHTML, renderPitchDeckToPDF } from "./pitchDeck";
import type { PitchDeckInput, ForecastMonth, RiskAlert, AgentInsights } from "./pitchDeck";
import { sdk } from "./_core/sdk";

export function registerPitchDeckRoute(app: Express) {
  app.get("/api/pitch-deck/:reportId", async (req: Request, res: Response) => {
    try {
      // ── Auth ──────────────────────────────────────────────────────────────
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // ── Fetch report ──────────────────────────────────────────────────────
      const reportId = parseInt(req.params.reportId, 10);
      if (isNaN(reportId)) {
        res.status(400).json({ error: "Invalid report ID" });
        return;
      }

      const report = await getReportById(reportId);
      if (!report || report.userId !== user.id) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      // ── Fetch simulation ──────────────────────────────────────────────────
      const sim = await getSimulationById(report.simulationId);
      if (!sim) {
        res.status(404).json({ error: "Simulation not found" });
        return;
      }

      // ── Parse simulation data ─────────────────────────────────────────────
      const forecast = ((sim.cashflowForecast as ForecastMonth[]) ?? []);
      const riskAlerts = ((sim.riskAlerts as RiskAlert[]) ?? []);
      const agentInsights = ((sim.agentInsights as AgentInsights) ?? {});
      const scenarioParams = (sim.scenarioParams as Record<string, unknown>) ?? {};

      // Compute KPIs from forecast
      const totalIncome = forecast.reduce((s, f) => s + f.income, 0);
      const totalExpense = forecast.reduce((s, f) => s + f.expense, 0);
      const netCashflow = totalIncome - totalExpense;
      const n = forecast.length || 1;
      const avgMonthlyIncome = totalIncome / n;
      const avgMonthlyExpense = totalExpense / n;
      const avgConfidence = forecast.reduce((s, f) => s + f.confidence, 0) / n;

      // Extract executive summary (first paragraph of report content)
      const lines = (report.content ?? "").split("\n").filter((l) => l.trim());
      const execSummary = report.summary ||
        lines.slice(0, 3).join(" ").replace(/#+\s*/g, "").substring(0, 400);

      // Extract recommendations from report content (lines after "Strategi" or "Rekomendasi")
      const recSection = report.content ?? "";
      const recMatches = recSection.match(/(?:^|\n)[-•*]\s+(.+)/gm) ?? [];
      const recommendations = recMatches
        .map((r) => r.replace(/^[-•*\s]+/, "").trim())
        .filter((r) => r.length > 10)
        .slice(0, 6);

      if (recommendations.length === 0) {
        recommendations.push(
          "Pantau cashflow harian dan bandingkan dengan proyeksi simulasi setiap minggu.",
          "Diversifikasi sumber pendapatan untuk mengurangi ketergantungan pada satu segmen pelanggan.",
          "Optimalkan pengeluaran operasional dengan mengidentifikasi biaya yang dapat dikurangi.",
          "Bangun cadangan kas minimal 3 bulan pengeluaran operasional sebagai buffer risiko.",
        );
      }

      // Business name from seed text or title
      const businessNameMatch = (sim.seedText ?? "").match(/(?:Bisnis|Usaha|Toko|Nama):\s*([^\n]+)/i);
      const businessName = businessNameMatch?.[1]?.trim() || user.name || "Bisnis UMKM";

      const input: PitchDeckInput = {
        businessName,
        reportTitle: report.title,
        generatedDate: new Date(report.createdAt).toLocaleDateString("id-ID", {
          day: "2-digit", month: "long", year: "numeric",
        }),
        seedText: sim.seedText ?? "",
        forecastMonths: sim.forecastMonths ?? forecast.length,
        riskLevel: sim.riskLevel ?? "medium",
        forecast,
        riskAlerts,
        agentInsights,
        executiveSummary: execSummary,
        recommendations,
        kpis: {
          totalIncome,
          totalExpense,
          netCashflow,
          avgMonthlyIncome,
          avgMonthlyExpense,
          avgConfidence,
        },
      };

      // ── Generate HTML ─────────────────────────────────────────────────────
      const html = buildPitchDeckHTML(input);

      // Check if client wants HTML preview (for the slide preview modal)
      if (req.query.format === "html") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(html);
        return;
      }

      // ── Render PDF ────────────────────────────────────────────────────────
      const pdfBuffer = await renderPitchDeckToPDF(html);

      const safeTitle = report.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-").toLowerCase();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="akunfish-pitchdeck-${safeTitle}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);

    } catch (err) {
      console.error("[PitchDeck] Error:", err);
      res.status(500).json({ error: "Failed to generate pitch deck" });
    }
  });
}
