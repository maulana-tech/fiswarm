import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, Wallet,
  FileText, ShieldAlert, Users, MessageSquare, Zap,
  CheckCircle, AlertTriangle, Info, ChevronRight,
  RefreshCw, Rocket, SlidersHorizontal, Database,
  ArrowRight, Play,
} from "lucide-react";
import { Streamdown } from "streamdown";

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatIDR(n: number) {
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${n.toFixed(0)}`;
}

// ─── Static demo data ────────────────────────────────────────────────────────
const DEMO_TRANSACTIONS = [
  { id: 1, date: "2026-01-05", description: "Penjualan Produk A", type: "income",  amount: 8_500_000 },
  { id: 2, date: "2026-01-08", description: "Pembelian Bahan Baku", type: "expense", amount: 3_200_000 },
  { id: 3, date: "2026-01-12", description: "Penjualan Produk B", type: "income",  amount: 5_750_000 },
  { id: 4, date: "2026-01-15", description: "Gaji Karyawan", type: "expense", amount: 4_500_000 },
  { id: 5, date: "2026-01-20", description: "Invoice Klien XYZ", type: "invoice", amount: 12_000_000 },
  { id: 6, date: "2026-01-22", description: "Sewa Tempat", type: "expense", amount: 2_000_000 },
  { id: 7, date: "2026-02-03", description: "Penjualan Online", type: "income",  amount: 9_200_000 },
  { id: 8, date: "2026-02-10", description: "Pembelian Peralatan", type: "expense", amount: 1_800_000 },
];

const DEMO_MONTHLY = [
  { month: "Sep", income: 18_200_000, expense: 12_400_000 },
  { month: "Oct", income: 21_500_000, expense: 13_800_000 },
  { month: "Nov", income: 19_800_000, expense: 14_200_000 },
  { month: "Dec", income: 24_300_000, expense: 15_600_000 },
  { month: "Jan", income: 23_450_000, expense: 13_700_000 },
  { month: "Feb", income: 26_100_000, expense: 14_900_000 },
];

const DEMO_SEED = `=== AKUNFISH BUSINESS SEED ===
Period: Sep 2025 – Feb 2026 (6 months)
Business Type: UMKM Retail / Produk

FINANCIAL SUMMARY:
  Total Income:   Rp 133.35M
  Total Expense:  Rp 84.60M
  Net Cashflow:   Rp 48.75M
  Avg Monthly Income:  Rp 22.23M
  Avg Monthly Expense: Rp 14.10M

INCOME BREAKDOWN:
  Penjualan Produk: 68% (Rp 90.7M)
  Invoice Klien:    22% (Rp 29.3M)
  Penjualan Online: 10% (Rp 13.4M)

EXPENSE BREAKDOWN:
  Gaji Karyawan:    32% (Rp 27.1M)
  Bahan Baku:       28% (Rp 23.7M)
  Sewa Tempat:      18% (Rp 15.2M)
  Peralatan:        12% (Rp 10.2M)
  Lainnya:          10% (Rp  8.5M)

TREND: Income +14% MoM growth. Expense stable.
CASHFLOW HEALTH: Positive. Surplus increasing.`;

const DEMO_AGENTS = [
  {
    key: "owner",
    label: "Owner",
    color: "oklch(0.72 0.14 195)",
    bg: "oklch(0.18 0.02 195)",
    border: "oklch(0.30 0.06 195)",
    insight: "Bisnis menunjukkan pertumbuhan yang konsisten dengan kenaikan pendapatan rata-rata 14% per bulan. Margin keuntungan bersih berada di 36.5%, yang tergolong sehat untuk UMKM retail. Disarankan untuk mengalokasikan 20% surplus untuk ekspansi kapasitas produksi di Q2 2026.",
  },
  {
    key: "supplier",
    label: "Supplier",
    color: "oklch(0.70 0.12 55)",
    bg: "oklch(0.18 0.02 55)",
    border: "oklch(0.30 0.06 55)",
    insight: "Pola pembelian bahan baku stabil dan teratur. Tidak ada keterlambatan pembayaran yang terdeteksi. Namun, ketergantungan pada satu kategori bahan baku (68%) menciptakan risiko rantai pasok. Disarankan diversifikasi supplier untuk mengurangi risiko gangguan pasokan.",
  },
  {
    key: "customer",
    label: "Customer",
    color: "oklch(0.65 0.12 145)",
    bg: "oklch(0.18 0.02 145)",
    border: "oklch(0.30 0.06 145)",
    insight: "Permintaan pelanggan meningkat stabil. Segmen penjualan online tumbuh 10% dari total pendapatan — indikasi pergeseran ke digital yang perlu dioptimalkan. Loyalitas pelanggan tinggi berdasarkan pola transaksi berulang. Harga produk masih kompetitif di pasar.",
  },
  {
    key: "bank",
    label: "Bank",
    color: "oklch(0.65 0.12 280)",
    bg: "oklch(0.18 0.02 280)",
    border: "oklch(0.30 0.06 280)",
    insight: "Rasio keuangan bisnis ini tergolong baik: Debt-to-Income rendah, cashflow positif selama 6 bulan berturut-turut. Bisnis ini memenuhi syarat untuk kredit modal kerja hingga Rp 150M dengan bunga preferensial. Rekam jejak pembayaran yang bersih meningkatkan skor kredit.",
  },
];

const DEMO_ALERTS = [
  {
    severity: "medium",
    title: "Konsentrasi Pendapatan Tinggi",
    description: "68% pendapatan berasal dari satu kategori produk. Diversifikasi produk disarankan untuk mengurangi risiko.",
  },
  {
    severity: "low",
    title: "Cashflow Positif Konsisten",
    description: "Surplus cashflow meningkat 6 bulan berturut-turut. Bisnis dalam kondisi finansial yang sehat.",
  },
  {
    severity: "high",
    title: "Invoice Belum Terbayar",
    description: "Terdapat invoice senilai Rp 12M yang belum terbayar. Risiko likuiditas jangka pendek jika tidak segera ditagih.",
  },
];

const DEMO_REPORT = `# Laporan Keuangan UMKM
**Periode:** September 2025 – Februari 2026
**Dibuat oleh:** AkunFish Swarm Intelligence

---

## Ringkasan Eksekutif

Bisnis menunjukkan **pertumbuhan yang kuat dan konsisten** selama periode 6 bulan terakhir. Total pendapatan mencapai **Rp 133.35 juta** dengan surplus bersih **Rp 48.75 juta**, mencerminkan margin keuntungan bersih sebesar **36.5%**.

---

## Analisis Cashflow

| Bulan | Pendapatan | Pengeluaran | Net |
|-------|-----------|-------------|-----|
| Sep 2025 | Rp 18.2M | Rp 12.4M | **+Rp 5.8M** |
| Okt 2025 | Rp 21.5M | Rp 13.8M | **+Rp 7.7M** |
| Nov 2025 | Rp 19.8M | Rp 14.2M | **+Rp 5.6M** |
| Des 2025 | Rp 24.3M | Rp 15.6M | **+Rp 8.7M** |
| Jan 2026 | Rp 23.5M | Rp 13.7M | **+Rp 9.8M** |
| Feb 2026 | Rp 26.1M | Rp 14.9M | **+Rp 11.2M** |

---

## Rekomendasi Strategis

1. **Diversifikasi Produk** — Kurangi ketergantungan pada satu kategori produk utama
2. **Percepat Penagihan Invoice** — Invoice Rp 12M perlu segera ditagih untuk menjaga likuiditas
3. **Ekspansi Digital** — Optimalkan kanal penjualan online yang tumbuh 10%
4. **Cadangan Dana Darurat** — Alokasikan 15% surplus sebagai dana darurat operasional`;

const DEMO_CHAT: Array<{ role: "user" | "assistant"; content: string; agent: string }> = [
  { role: "user", content: "Bagaimana kondisi cashflow bisnis saya?", agent: "owner" },
  { role: "assistant", content: "Cashflow bisnis Anda dalam kondisi **sangat sehat**. Selama 6 bulan terakhir, surplus bersih meningkat dari Rp 5.8M menjadi Rp 11.2M per bulan — pertumbuhan 93%. Tren ini sangat positif dan menunjukkan bisnis Anda semakin efisien.", agent: "owner" },
  { role: "user", content: "Apa risiko terbesar dalam 3 bulan ke depan?", agent: "owner" },
  { role: "assistant", content: "Risiko utama yang perlu diwaspadai:\n\n1. **Invoice belum terbayar** (Rp 12M) — jika tidak tertagih, bisa mengganggu likuiditas\n2. **Konsentrasi produk** — 68% dari satu kategori, rentan terhadap perubahan pasar\n3. **Kenaikan biaya bahan baku** — tren global menunjukkan potensi kenaikan 8-12% di Q2 2026\n\nSaran: prioritaskan penagihan invoice dan mulai diversifikasi lini produk.", agent: "owner" },
];

// ─── Risk config ─────────────────────────────────────────────────────────────
const riskConfig = {
  critical: { icon: AlertTriangle, label: "CRITICAL", textColor: "text-[oklch(0.55_0.22_25)]", bgColor: "bg-[oklch(0.16_0.04_25)]/50", borderColor: "border-[oklch(0.35_0.10_25)]", badgeBg: "bg-[oklch(0.16_0.04_25)] text-[oklch(0.55_0.22_25)] border-[oklch(0.35_0.10_25)]" },
  high:     { icon: AlertTriangle, label: "HIGH",     textColor: "text-[oklch(0.60_0.18_25)]", bgColor: "bg-[oklch(0.18_0.02_25)]/40", borderColor: "border-[oklch(0.30_0.08_25)]", badgeBg: "bg-[oklch(0.18_0.02_25)] text-[oklch(0.60_0.18_25)] border-[oklch(0.30_0.08_25)]" },
  medium:   { icon: Info,          label: "MEDIUM",   textColor: "text-[oklch(0.70_0.12_55)]",  bgColor: "bg-[oklch(0.18_0.02_55)]/40",  borderColor: "border-[oklch(0.30_0.06_55)]",  badgeBg: "bg-[oklch(0.18_0.02_55)] text-[oklch(0.70_0.12_55)] border-[oklch(0.30_0.06_55)]"  },
  low:      { icon: CheckCircle,   label: "LOW",      textColor: "text-[oklch(0.65_0.12_145)]", bgColor: "bg-[oklch(0.18_0.02_145)]/40", borderColor: "border-[oklch(0.30_0.06_145)]", badgeBg: "bg-[oklch(0.18_0.02_145)] text-[oklch(0.65_0.12_145)] border-[oklch(0.30_0.06_145)]" },
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[oklch(0.16_0.006_240)] border border-[oklch(0.24_0.008_240)] rounded-lg p-3 text-xs shadow-xl">
      <div className="text-muted-foreground mb-2 font-medium">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>{formatIDR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuickDemo() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeAgent, setActiveAgent] = useState("owner");
  const [seedExpanded, setSeedExpanded] = useState(false);
  const [priceChange, setPriceChange] = useState(10);
  const [employeeCount, setEmployeeCount] = useState(2);
  const [inventoryBudget, setInventoryBudget] = useState(3_000_000);
  const [marketGrowth, setMarketGrowth] = useState(15);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(DEMO_CHAT);
  const [isSending, setIsSending] = useState(false);

  // Compute what-if adjusted forecast
  const baseForecast = [
    { month: "Mar 2026", income: 27_500_000, expense: 15_800_000 },
    { month: "Apr 2026", income: 29_200_000, expense: 16_400_000 },
    { month: "May 2026", income: 31_000_000, expense: 17_100_000 },
  ];

  const adjustedForecast = useMemo(() => {
    return baseForecast.map((row) => {
      const incomeAdj = row.income * (1 + priceChange / 100) * (1 + marketGrowth / 100);
      const expenseAdj = row.expense + employeeCount * 3_500_000 + inventoryBudget;
      const net = incomeAdj - expenseAdj;
      return {
        month: row.month,
        income: Math.round(incomeAdj),
        expense: Math.round(expenseAdj),
        net: Math.round(net),
        confidence: 82,
      };
    });
  }, [priceChange, employeeCount, inventoryBudget, marketGrowth]);

  const totalNet = adjustedForecast.reduce((s, r) => s + r.net, 0);

  const handleDemoChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user" as const, content: chatInput, agent: activeAgent };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsSending(true);
    setTimeout(() => {
      const responses: Record<string, string> = {
        owner: "Berdasarkan data simulasi, bisnis Anda berada dalam kondisi yang **sangat baik**. Dengan skenario what-if yang Anda atur (harga +10%, 2 karyawan baru, market growth +15%), proyeksi net cashflow 3 bulan ke depan adalah **positif dan meningkat**. Rekomendasi: lanjutkan strategi ekspansi yang terencana.",
        supplier: "Dengan penambahan anggaran inventori Rp 3M/bulan, kapasitas stok meningkat sekitar 20%. Pastikan kontrak dengan supplier utama diperpanjang minimal 6 bulan ke depan untuk mengunci harga dan menghindari fluktuasi biaya bahan baku.",
        customer: "Kenaikan harga 10% masih dalam batas toleransi pelanggan berdasarkan analisis elastisitas harga. Segmen pelanggan loyal (>60%) tidak sensitif terhadap kenaikan harga di bawah 15%. Fokus pada peningkatan nilai produk untuk mempertahankan loyalitas.",
        bank: "Profil keuangan bisnis ini sangat kuat untuk pengajuan kredit. Dengan cashflow positif konsisten dan rencana ekspansi yang terstruktur, bisnis ini layak mendapat fasilitas kredit investasi dengan plafon hingga Rp 200M.",
        report: "Ringkasan simulasi: Skenario what-if menunjukkan proyeksi positif dengan total net cashflow 3 bulan sebesar " + formatIDR(totalNet) + ". Risiko utama adalah kenaikan biaya operasional dari penambahan karyawan. Rekomendasi: jalankan ekspansi secara bertahap.",
      };
      const reply = {
        role: "assistant" as const,
        content: responses[activeAgent] ?? "Analisis sedang diproses...",
        agent: activeAgent,
      };
      setChatMessages((prev) => [...prev, reply]);
      setIsSending(false);
    }, 1200);
  };

  const currentAgent = DEMO_AGENTS.find((a) => a.key === activeAgent) ?? DEMO_AGENTS[0];
  const visibleChat = chatMessages.filter((m) => m.agent === activeAgent);

  const kpis = [
    { label: "Total Pendapatan", value: "Rp 133.4M", sub: "6 bulan terakhir", icon: TrendingUp, color: "text-[oklch(0.65_0.12_145)]", bg: "bg-[oklch(0.18_0.02_145)]/30" },
    { label: "Total Pengeluaran", value: "Rp 84.6M",  sub: "6 bulan terakhir", icon: TrendingDown, color: "text-[oklch(0.60_0.18_25)]", bg: "bg-[oklch(0.18_0.02_25)]/30" },
    { label: "Net Cashflow",      value: "Rp 48.8M",  sub: "Surplus positif", icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "Invoice Pending",   value: "Rp 12.0M",  sub: "1 invoice aktif", icon: FileText, color: "text-[oklch(0.70_0.12_55)]", bg: "bg-[oklch(0.18_0.02_55)]/30" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">DEMO MODE</span>
          <span className="text-xs text-muted-foreground">— Data sampel, tidak memerlukan login</span>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Kembali
        </Button>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">AkunFish — Quick Demo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Demo interaktif platform keuangan UMKM dengan Swarm AI. Semua data adalah contoh simulasi.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
            <Play className="h-3.5 w-3.5 text-primary" />
            <span>Toko Maju Jaya — Demo Business</span>
          </div>
        </div>

        {/* Tab navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {[
              { id: "dashboard", icon: BarChart3,       label: "Dashboard"   },
              { id: "seed",      icon: Database,         label: "Seed"        },
              { id: "whatif",    icon: SlidersHorizontal,label: "What-if"     },
              { id: "forecast",  icon: Rocket,           label: "Forecast"    },
              { id: "risk",      icon: ShieldAlert,      label: "Risk Alerts" },
              { id: "agents",    icon: Users,            label: "Agents"      },
              { id: "chat",      icon: MessageSquare,    label: "Chat"        },
              { id: "report",    icon: FileText,         label: "Report"      },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ── TAB: Dashboard ─────────────────────────────────────────────── */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card key={kpi.label} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className={`w-7 h-7 rounded flex items-center justify-center mb-2.5 ${kpi.bg}`}>
                        <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                      </div>
                      <div className={`text-base font-bold tabular-nums ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
                      <div className="text-[10px] text-muted-foreground/60">{kpi.sub}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Income vs Expense (6 Bulan)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={DEMO_MONTHLY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatIDR} width={58} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="income" name="Income" fill="oklch(0.65 0.12 145)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="oklch(0.60 0.18 25)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[oklch(0.65_0.12_145)]" /><span className="text-[10px] text-muted-foreground">Income</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[oklch(0.60_0.18_25)]" /><span className="text-[10px] text-muted-foreground">Expense</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Net Cashflow Trend
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={DEMO_MONTHLY.map(r => ({ ...r, net: r.income - r.expense }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="demoNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatIDR} width={58} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area dataKey="net" name="Net Cashflow" stroke="oklch(0.72 0.14 195)" strokeWidth={2} fill="url(#demoNet)" dot={{ fill: "oklch(0.72 0.14 195)", r: 3, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Transaction table */}
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transaksi Terbaru</div>
                  <span className="text-[10px] text-muted-foreground">8 transaksi</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-accent/10">
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-left">Tanggal</th>
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-left">Deskripsi</th>
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-left">Tipe</th>
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_TRANSACTIONS.map((tx, i) => (
                        <tr key={tx.id} className={`border-b border-border/40 hover:bg-accent/20 ${i % 2 === 0 ? "" : "bg-accent/5"}`}>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{tx.date}</td>
                          <td className="px-4 py-2.5 text-xs font-medium">{tx.description}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                              tx.type === "income"  ? "bg-[oklch(0.18_0.02_145)]/40 text-[oklch(0.65_0.12_145)] border-[oklch(0.30_0.06_145)]" :
                              tx.type === "expense" ? "bg-[oklch(0.18_0.02_25)]/40  text-[oklch(0.60_0.18_25)]  border-[oklch(0.30_0.08_25)]" :
                                                      "bg-[oklch(0.18_0.02_55)]/40  text-[oklch(0.70_0.12_55)]  border-[oklch(0.30_0.06_55)]"
                            }`}>
                              {tx.type.toUpperCase()}
                            </span>
                          </td>
                          <td className={`px-4 py-2.5 text-xs tabular-nums text-right font-semibold ${
                            tx.type === "income" ? "text-[oklch(0.65_0.12_145)]" : tx.type === "expense" ? "text-[oklch(0.60_0.18_25)]" : "text-[oklch(0.70_0.12_55)]"
                          }`}>
                            {tx.type === "expense" ? "−" : "+"}{formatIDR(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setActiveTab("seed")} className="gap-1.5">
                Lanjut ke Seed Generator <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TabsContent>

          {/* ── TAB: Seed Generator ────────────────────────────────────────── */}
          <TabsContent value="seed" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Auto Seed Generator</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-accent/30 px-2 py-0.5 rounded border border-border">6 months</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sistem mengekstrak pola keuangan dari 6 bulan data transaksi dan mengkonversinya menjadi seed text terstruktur untuk agen AI.
                </p>

                <div className="rounded-lg border border-[oklch(0.30_0.06_145)] bg-[oklch(0.18_0.02_145)]/20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.30_0.06_145)]/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[oklch(0.65_0.12_145)]" />
                      <span className="text-xs font-semibold text-[oklch(0.65_0.12_145)]">Seed Berhasil Dibuat</span>
                      <span className="text-xs text-muted-foreground">— 8 transaksi</span>
                    </div>
                    <button
                      onClick={() => setSeedExpanded(!seedExpanded)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {seedExpanded ? "Sembunyikan" : "Lihat Seed Text"}
                    </button>
                  </div>
                  {seedExpanded && (
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 max-h-64 overflow-y-auto">
                      {DEMO_SEED}
                    </pre>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Transaksi", value: "8" },
                    { label: "Periode Data", value: "6 Bulan" },
                    { label: "Kategori", value: "3 Tipe" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border bg-accent/10 p-3 text-center">
                      <div className="text-base font-bold text-primary tabular-nums">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <Button size="sm" className="w-full gap-1.5" onClick={() => setActiveTab("whatif")}>
                  Lanjut ke What-if Scenarios <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: What-if Scenarios ─────────────────────────────────────── */}
          <TabsContent value="whatif" className="space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-6">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">What-if Scenario Parameters</span>
                  <span className="ml-auto text-xs text-[oklch(0.70_0.12_55)] bg-[oklch(0.18_0.02_55)]/30 px-2 py-0.5 rounded border border-[oklch(0.30_0.06_55)]">
                    Skenario Aktif
                  </span>
                </div>

                {/* Price Change */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Perubahan Harga</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${priceChange > 0 ? "text-[oklch(0.65_0.12_145)]" : priceChange < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {priceChange > 0 ? "+" : ""}{priceChange}%
                    </span>
                  </div>
                  <Slider value={[priceChange]} onValueChange={([v]) => setPriceChange(v)} min={-30} max={50} step={5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="text-destructive/70">−30% (turun harga)</span>
                    <span className="text-[oklch(0.65_0.12_145)]/70">+50% (naik harga)</span>
                  </div>
                </div>

                {/* Employee */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Tambah Karyawan</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold tabular-nums">{employeeCount} orang</span>
                      {employeeCount > 0 && <div className="text-[10px] text-destructive/80">+{formatIDR(employeeCount * 3_500_000)}/bulan</div>}
                    </div>
                  </div>
                  <Slider value={[employeeCount]} onValueChange={([v]) => setEmployeeCount(v)} min={0} max={10} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>0 karyawan</span><span>10 karyawan</span></div>
                </div>

                {/* Inventory */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Tambah Inventori / Bulan</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{formatIDR(inventoryBudget)}</span>
                  </div>
                  <Slider value={[inventoryBudget]} onValueChange={([v]) => setInventoryBudget(v)} min={0} max={20_000_000} step={500_000} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>Rp 0</span><span>Rp 20M</span></div>
                </div>

                {/* Market Growth */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Asumsi Pertumbuhan Pasar</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${marketGrowth > 0 ? "text-[oklch(0.65_0.12_145)]" : marketGrowth < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {marketGrowth > 0 ? "+" : ""}{marketGrowth}%
                    </span>
                  </div>
                  <Slider value={[marketGrowth]} onValueChange={([v]) => setMarketGrowth(v)} min={-20} max={30} step={5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span className="text-destructive/70">−20% (kontraksi)</span><span className="text-[oklch(0.65_0.12_145)]/70">+30% (pertumbuhan)</span></div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="text-xs font-medium text-primary mb-3">Proyeksi Langsung (3 Bulan)</div>
                  <div className="grid grid-cols-3 gap-3">
                    {adjustedForecast.map((row) => (
                      <div key={row.month} className="text-center">
                        <div className="text-[10px] text-muted-foreground mb-1">{row.month}</div>
                        <div className={`text-sm font-bold tabular-nums ${row.net >= 0 ? "text-primary" : "text-destructive"}`}>
                          {row.net >= 0 ? "+" : ""}{formatIDR(row.net)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">net</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total 3 bulan:</span>
                    <span className={`text-sm font-bold tabular-nums ${totalNet >= 0 ? "text-primary" : "text-destructive"}`}>
                      {totalNet >= 0 ? "+" : ""}{formatIDR(totalNet)}
                    </span>
                  </div>
                </div>

                <Button size="sm" className="w-full gap-1.5" onClick={() => setActiveTab("forecast")}>
                  Lihat Forecast Lengkap <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Forecast ──────────────────────────────────────────────── */}
          <TabsContent value="forecast" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Proyeksi Pendapatan", value: formatIDR(adjustedForecast.reduce((s,r)=>s+r.income,0)), color: "text-[oklch(0.65_0.12_145)]" },
                { label: "Total Proyeksi Pengeluaran", value: formatIDR(adjustedForecast.reduce((s,r)=>s+r.expense,0)), color: "text-[oklch(0.60_0.18_25)]" },
                { label: "Net Cashflow 3 Bulan", value: (totalNet>=0?"+":"")+formatIDR(totalNet), color: totalNet>=0?"text-primary":"text-destructive" },
                { label: "Rata-rata Confidence", value: "82%", color: "text-muted-foreground" },
              ].map((k) => (
                <Card key={k.label} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className={`text-base font-bold tabular-nums ${k.color}`}>{k.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{k.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Proyeksi Income vs Expense</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={adjustedForecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatIDR} width={58} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="income" name="Income" fill="oklch(0.65 0.12 145)" radius={[3,3,0,0]} />
                      <Bar dataKey="expense" name="Expense" fill="oklch(0.60 0.18 25)" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Net Cashflow Projection</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={adjustedForecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="forecastNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatIDR} width={58} />
                      <ReferenceLine y={0} stroke="oklch(0.55 0.15 25)" strokeDasharray="4 4" strokeWidth={1.5} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area dataKey="net" name="Net Cashflow" stroke="oklch(0.72 0.14 195)" strokeWidth={2} fill="url(#forecastNet)" dot={{ fill: "oklch(0.72 0.14 195)", r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Breakdown</div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-accent/10">
                      {["Bulan","Pendapatan","Pengeluaran","Net","Confidence"].map((h,i) => (
                        <th key={h} className={`text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 ${i===0?"text-left":"text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjustedForecast.map((row, i) => (
                      <tr key={row.month} className={`border-b border-border/40 hover:bg-accent/20 ${i%2===0?"":"bg-accent/5"}`}>
                        <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-[oklch(0.65_0.12_145)]">{formatIDR(row.income)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-[oklch(0.60_0.18_25)]">{formatIDR(row.expense)}</td>
                        <td className={`px-4 py-3 text-sm tabular-nums text-right font-bold ${row.net>=0?"text-primary":"text-destructive"}`}>
                          {row.net>=0?"+":""}{formatIDR(row.net)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-accent overflow-hidden">
                              <div className="h-full rounded-full bg-primary/60" style={{ width: `${row.confidence}%` }} />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{row.confidence}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Risk Alerts ───────────────────────────────────────────── */}
          <TabsContent value="risk" className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {(["critical","high","medium","low"] as const).map((level) => {
                const count = DEMO_ALERTS.filter(a=>a.severity===level).length;
                const cfg = riskConfig[level];
                const Icon = cfg.icon;
                return (
                  <div key={level} className={`rounded-lg border p-3 text-center ${count>0?`${cfg.bgColor} ${cfg.borderColor}`:"border-border bg-card opacity-40"}`}>
                    <Icon className={`h-4 w-4 mx-auto mb-1 ${count>0?cfg.textColor:"text-muted-foreground"}`} />
                    <div className={`text-lg font-bold tabular-nums ${count>0?cfg.textColor:"text-muted-foreground"}`}>{count}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{cfg.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              {DEMO_ALERTS.map((alert, i) => {
                const cfg = riskConfig[alert.severity as keyof typeof riskConfig] ?? riskConfig.medium;
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${cfg.bgColor} ${cfg.borderColor}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bgColor} border ${cfg.borderColor}`}>
                      <Icon className={`h-4 w-4 ${cfg.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">{alert.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${cfg.badgeBg}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ── TAB: Agent Insights ────────────────────────────────────────── */}
          <TabsContent value="agents" className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {DEMO_AGENTS.map((agent) => (
                <Card key={agent.key} className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: agent.border, background: agent.bg + "33" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0" style={{ background: agent.bg, color: agent.color, border: `1px solid ${agent.border}` }}>
                        {agent.label[0]}
                      </div>
                      <div>
                        <div className="text-xs font-semibold" style={{ color: agent.color }}>{agent.label} Agent</div>
                      </div>
                      <button
                        className="ml-auto text-[10px] px-2 py-1 rounded border transition-colors hover:opacity-80"
                        style={{ borderColor: agent.border, color: agent.color, background: agent.bg }}
                        onClick={() => { setActiveAgent(agent.key); setActiveTab("chat"); }}
                      >
                        Chat
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground leading-relaxed">{agent.insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── TAB: Chat ──────────────────────────────────────────────────── */}
          <TabsContent value="chat" className="space-y-3">
            {/* Agent selector */}
            <div className="flex flex-wrap gap-2">
              {DEMO_AGENTS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setActiveAgent(a.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${activeAgent===a.key?"border-current":"border-border text-muted-foreground hover:border-foreground/30"}`}
                  style={activeAgent===a.key?{ color: a.color, background: a.bg, borderColor: a.border }:{}}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={activeAgent===a.key?{ background: a.border, color: a.color }:{ background: "oklch(0.22 0.006 240)", color: "oklch(0.55 0.008 240)" }}>
                    {a.label[0]}
                  </div>
                  {a.label}
                </button>
              ))}
            </div>

            {/* Agent info bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs" style={{ borderColor: currentAgent.border, background: currentAgent.bg + "44", color: currentAgent.color }}>
              <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px]" style={{ background: currentAgent.border }}>{currentAgent.label[0]}</div>
              <span className="font-semibold">{currentAgent.label} Agent</span>
              <span className="text-muted-foreground ml-auto text-[10px]">Demo — respons instan</span>
            </div>

            {/* Messages */}
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {visibleChat.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Mulai percakapan dengan {currentAgent.label} Agent
                    </div>
                  )}
                  {visibleChat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.role==="user"?"bg-primary text-primary-foreground":"bg-accent/40 text-foreground border border-border"}`}>
                        {msg.role === "assistant" ? (
                          <Streamdown>{msg.content}</Streamdown>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-accent/40 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-border p-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDemoChat()}
                    placeholder={`Tanya ${currentAgent.label} agent...`}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button size="sm" onClick={handleDemoChat} disabled={isSending || !chatInput.trim()}>
                    Kirim
                  </Button>
                </div>
                {/* Suggested prompts */}
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {[
                    "Bagaimana kondisi cashflow?",
                    "Apa risiko terbesar?",
                    "Rekomendasi untuk ekspansi?",
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => { setChatInput(p); }}
                      className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Report ────────────────────────────────────────────────── */}
          <TabsContent value="report" className="space-y-4">
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-accent/10">
                  <div>
                    <div className="text-sm font-semibold">Laporan Keuangan UMKM</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sep 2025 – Feb 2026 · Dibuat oleh AkunFish AI</div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded border border-[oklch(0.30_0.06_145)] bg-[oklch(0.18_0.02_145)]/40 text-[oklch(0.65_0.12_145)] font-medium">
                    SELESAI
                  </span>
                </div>
                <div className="p-5 prose prose-sm prose-invert max-w-none">
                  <Streamdown>{DEMO_REPORT}</Streamdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
