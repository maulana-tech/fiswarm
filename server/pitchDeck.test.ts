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
  reportTitle: "Laporan Simulasi Q1 2024",
  generatedDate: "1 Januari 2024",
  seedText: "Bisnis: Toko Maju Jaya\nJenis: Retail",
  forecastMonths: 3,
  riskLevel: "medium",
  forecast: sampleForecast,
  riskAlerts: [
    { severity: "medium", title: "Cashflow Tipis", description: "Margin cashflow di bulan Maret sangat tipis." },
    { severity: "low", title: "Stok Menipis", description: "Perlu restock sebelum akhir bulan." },
  ],
  agentInsights: {
    owner: "Perlu diversifikasi produk untuk meningkatkan margin.",
    supplier: "Harga bahan baku stabil, tidak ada kenaikan signifikan.",
    customer: "Permintaan meningkat di akhir bulan.",
    bank: "Rasio likuiditas masih dalam batas aman.",
  },
  executiveSummary: "Bisnis menunjukkan tren positif dengan cashflow net positif selama 3 bulan.",
  recommendations: [
    "Tingkatkan stok produk unggulan sebelum musim ramai.",
    "Negosiasikan harga supplier untuk menekan biaya.",
    "Buka saluran penjualan online untuk memperluas jangkauan.",
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
    expect(html).toContain("Laporan Simulasi Q1 2024");
  });

  it("includes risk level badge", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("MEDIUM");
  });

  it("includes all 4 agent names in Indonesian", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Pemilik Bisnis");
    expect(html).toContain("Supplier");
    expect(html).toContain("Pelanggan");
    expect(html).toContain("Bank / Keuangan");
  });

  it("includes risk alert titles", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Cashflow Tipis");
    expect(html).toContain("Stok Menipis");
  });

  it("includes recommendations", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("Tingkatkan stok produk unggulan");
    expect(html).toContain("Negosiasikan harga supplier");
  });

  it("includes SVG bar chart for forecast data", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("<svg");
    expect(html).toContain("Pendapatan");
    expect(html).toContain("Pengeluaran");
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
    expect(html).toContain("Tidak ada peringatan risiko");
  });

  it("includes executive summary text", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("tren positif");
  });

  it("includes confidence percentages in forecast table", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("85%");
    expect(html).toContain("78%");
    expect(html).toContain("65%");
  });

  it("includes AkunFish branding on every slide", () => {
    const html = buildPitchDeckHTML(sampleInput);
    const brandCount = (html.match(/AkunFish/g) ?? []).length;
    expect(brandCount).toBeGreaterThanOrEqual(9); // at least once per slide
  });

  it("slide 9 closing contains thank you message", () => {
    const html = buildPitchDeckHTML(sampleInput);
    expect(html).toContain("TERIMA KASIH");
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
