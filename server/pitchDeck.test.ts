import { describe, expect, it } from "vitest";
import { buildPitchDeckHTML } from "./pitchDeck";
import type { PitchDeckInput } from "./pitchDeck";

const sampleForecast = [
  { month: "2024-01", income: 15_000_000, expense: 10_000_000, net: 5_000_000, confidence: 85 },
  { month: "2024-02", income: 18_000_000, expense: 12_000_000, net: 6_000_000, confidence: 78 },
  { month: "2024-03", income: 14_000_000, expense: 13_000_000, net: 1_000_000, confidence: 65 },
];

const sampleInput: PitchDeckInput = {
  businessName: "Toko Maju Jaya",
  reportTitle: "Simulation Report Q1 2024",
  generatedDate: "January 1, 2024",
  seedText: "Business: Toko Maju Jaya\nType: Retail",
  forecastMonths: 3,
  riskLevel: "medium",
  forecast: sampleForecast,
  riskAlerts: [
    { severity: "medium", title: "Thin Cashflow", description: "Cashflow margin in March is very thin." },
    { severity: "low", title: "Low Stock", description: "Restock needed before end of month." },
  ],
  agentInsights: {
    owner: "Need to diversify products to improve margins.",
    supplier: "Raw material prices are stable, no significant increases.",
    customer: "Demand increases at end of month.",
    bank: "Liquidity ratio is still within safe limits.",
  },
  executiveSummary: "Business shows a positive trend with positive net cashflow for 3 months.",
  recommendations: [
    "Increase stock of top products before peak season.",
    "Negotiate supplier prices to reduce costs.",
    "Open online sales channels to expand reach.",
  ],
  kpis: {
    totalIncome: 47_000_000,
    totalExpense: 35_000_000,
    netCashflow: 12_000_000,
    avgMonthlyIncome: 15_666_667,
    avgMonthlyExpense: 11_666_667,
    avgConfidence: 76,
  },
};

describe("buildPitchDeckHTML", () => {
  it("returns a valid HTML string", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(typeof html).toBe("string");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
  });

  it("includes all 9 slides", () => {
    const html = buildPitchDeckHTML(sampleInput);
    for (let i = 1; i <= 9; i++) {
      expect(html).toContain(`id="slide-${i}"`);
    }
  });

  it("includes business name on cover slide", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Toko Maju Jaya");
  });

  it("includes report title", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Simulation Report Q1 2024");
  });

  it("includes risk level badge", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("MEDIUM");
  });

  it("includes all 4 agent names", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Owner");
    expect(html).toContain("Supplier");
    expect(html).toContain("Customer");
    expect(html).toContain("Bank");
  });

  it("includes risk alert titles", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Thin Cashflow");
    expect(html).toContain("Low Stock");
  });

  it("includes recommendations", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Increase stock of top products");
    expect(html).toContain("Negotiate supplier prices");
  });

  it("includes SVG bar chart for forecast data", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("<svg");
    expect(html).toContain("Revenue");
    expect(html).toContain("Expenses");
  });

  it("includes forecast month labels", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("2024-01");
    expect(html).toContain("2024-02");
    expect(html).toContain("2024-03");
  });

  it("formats IDR values correctly", () => {
    const html = buildPitchDeckHTML(sampleInput);
    // 47_000_000 → Rp 47.0jt
    expect(html).toContain("Rp 47.0jt");
    // 12_000_000 → Rp 12.0jt
    expect(html).toContain("Rp 12.0jt");
  });

  it("shows no-risk message when riskAlerts is empty", () => {
    const noRiskInput = { ...sampleInput, riskAlerts: [] };
    const html = buildPitchDeckHTML(noRiskInput);
    expect(html).toContain("No risk alerts");
  });

  it("includes executive summary text", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("positive trend");
  });

  it("includes confidence percentages in forecast table", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("85%");
    expect(html).toContain("78%");
    expect(html).toContain("65%");
  });

  it("includes FiSwarm branding on every slide", () => {
    const html = buildPitchDeckHTML(sampleInput);
    const brandCount = (html.match(/FiSwarm/g) ?? []).length;
    expect(brandCount).toBeGreaterThanOrEqual(9); // at least once per slide
  });

  it("slide 9 closing contains thank you message", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("THANK YOU");
  });

  it("handles critical risk level with correct color reference", () => {
    const criticalInput = { ...sampleInput, riskLevel: "critical" };
    const html = buildPitchDeckHTML(criticalInput);
    expect(html).toContain("CRITICAL");
    expect(html).toContain("#ef4444");
  });

  it("handles negative net cashflow color correctly", () => {
    const negInput: PitchDeckInput = {
      ...sampleInput,
      kpis: { ...sampleInput.kpis, netCashflow: -5_000_000 },
    };
    const html = buildPitchDeckHTML(negInput);
    // Negative cashflow should show red color
    expect(html).toContain("#ff6b6b");
  });
});
