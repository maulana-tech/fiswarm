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
import { trpc } from "@/lib/trpc";

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Static demo data ────────────────────────────────────────────────────────
const DEMO_TRANSACTIONS = [
  { id: 1, date: "2026-01-05", description: "Product A Sales",        type: "income",  amount: 8_500_000 },
  { id: 2, date: "2026-01-08", description: "Raw Material Purchase",  type: "expense", amount: 3_200_000 },
  { id: 3, date: "2026-01-12", description: "Product B Sales",        type: "income",  amount: 5_750_000 },
  { id: 4, date: "2026-01-15", description: "Employee Salaries",      type: "expense", amount: 4_500_000 },
  { id: 5, date: "2026-01-20", description: "Client XYZ Invoice",     type: "invoice", amount: 12_000_000 },
  { id: 6, date: "2026-01-22", description: "Office Rent",            type: "expense", amount: 2_000_000 },
  { id: 7, date: "2026-02-03", description: "Online Store Sales",     type: "income",  amount: 9_200_000 },
  { id: 8, date: "2026-02-10", description: "Equipment Purchase",     type: "expense", amount: 1_800_000 },
];

const DEMO_MONTHLY = [
  { month: "Sep", income: 18_200_000, expense: 12_400_000 },
  { month: "Oct", income: 21_500_000, expense: 13_800_000 },
  { month: "Nov", income: 19_800_000, expense: 14_200_000 },
  { month: "Dec", income: 24_300_000, expense: 15_600_000 },
  { month: "Jan", income: 23_450_000, expense: 13_700_000 },
  { month: "Feb", income: 26_100_000, expense: 14_900_000 },
];

const DEMO_SEED = `=== FISWARM BUSINESS SEED ===
Period: Sep 2025 – Feb 2026 (6 months)
Business Type: SME Retail / Products

FINANCIAL SUMMARY:
  Total Income:   $133.35M
  Total Expense:  $84.60M
  Net Cashflow:   $48.75M
  Avg Monthly Income:  $22.23M
  Avg Monthly Expense: $14.10M

INCOME BREAKDOWN:
  Product Sales:   68% ($90.7M)
  Client Invoices: 22% ($29.3M)
  Online Sales:    10% ($13.4M)

EXPENSE BREAKDOWN:
  Employee Salaries: 32% ($27.1M)
  Raw Materials:     28% ($23.7M)
  Office Rent:       18% ($15.2M)
  Equipment:         12% ($10.2M)
  Other:             10% ($ 8.5M)

TREND: Income +14% MoM growth. Expense stable.
CASHFLOW HEALTH: Positive. Surplus increasing.`;

const DEMO_AGENTS = [
  {
    key: "owner",
    label: "Owner",
    color: "oklch(0.72 0.14 195)",
    bg: "oklch(0.18 0.02 195)",
    border: "oklch(0.30 0.06 195)",
    insight: "Business shows consistent growth with average revenue increase of 14% per month. Net profit margin stands at 36.5%, which is healthy for an SME retail operation. Recommended to allocate 20% of surplus toward production capacity expansion in Q2 2026.",
  },
  {
    key: "supplier",
    label: "Supplier",
    color: "oklch(0.70 0.12 55)",
    bg: "oklch(0.18 0.02 55)",
    border: "oklch(0.30 0.06 55)",
    insight: "Raw material purchasing patterns are stable and regular. No payment delays detected. However, dependence on a single raw material category (68%) creates supply chain risk. Supplier diversification is recommended to reduce disruption risk.",
  },
  {
    key: "customer",
    label: "Customer",
    color: "oklch(0.65 0.12 145)",
    bg: "oklch(0.18 0.02 145)",
    border: "oklch(0.30 0.06 145)",
    insight: "Customer demand is growing steadily. The online sales segment now accounts for 10% of total revenue — a digital shift that needs to be optimized. Customer loyalty is high based on repeat transaction patterns. Product pricing remains competitive in the market.",
  },
  {
    key: "bank",
    label: "Bank",
    color: "oklch(0.65 0.12 280)",
    bg: "oklch(0.18 0.02 280)",
    border: "oklch(0.30 0.06 280)",
    insight: "This business has strong financial ratios: low Debt-to-Income, positive cashflow for 6 consecutive months. The business qualifies for working capital credit up to $150M at preferential rates. A clean payment track record boosts the credit score.",
  },
];

const DEMO_ALERTS = [
  {
    severity: "medium",
    title: "High Revenue Concentration",
    description: "68% of revenue comes from a single product category. Product diversification is recommended to reduce concentration risk.",
  },
  {
    severity: "low",
    title: "Consistent Positive Cashflow",
    description: "Cashflow surplus has grown for 6 consecutive months. Business is in a healthy financial condition.",
  },
  {
    severity: "high",
    title: "Unpaid Invoice Outstanding",
    description: "There is an outstanding invoice worth $12M. Short-term liquidity risk if not collected promptly.",
  },
];

const DEMO_REPORT = `# Financial Report — SME Business
**Period:** September 2025 – February 2026
**Generated by:** FiSwarm Swarm Intelligence

---

## Executive Summary

The business demonstrates **strong and consistent growth** over the past 6-month period. Total revenue reached **$133.35 million** with a net surplus of **$48.75 million**, reflecting a net profit margin of **36.5%**.

---

## Cashflow Analysis

| Month | Revenue | Expenses | Net |
|-------|---------|----------|-----|
| Sep 2025 | $18.2M | $12.4M | **+$5.8M** |
| Oct 2025 | $21.5M | $13.8M | **+$7.7M** |
| Nov 2025 | $19.8M | $14.2M | **+$5.6M** |
| Dec 2025 | $24.3M | $15.6M | **+$8.7M** |
| Jan 2026 | $23.5M | $13.7M | **+$9.8M** |
| Feb 2026 | $26.1M | $14.9M | **+$11.2M** |

---

## Strategic Recommendations

1. **Diversify Products** — Reduce dependence on a single primary product category
2. **Accelerate Invoice Collection** — The $12M invoice must be collected promptly to maintain liquidity
3. **Digital Expansion** — Optimize the online sales channel that has grown 10%
4. **Emergency Reserve Fund** — Allocate 15% of surplus as an operational emergency reserve`;

const DEMO_CHAT: Array<{ role: "user" | "assistant"; content: string; agent: string }> = [
  { role: "user", content: "How is my business cashflow doing?", agent: "owner" },
  { role: "assistant", content: "Your business cashflow is in **excellent health**. Over the past 6 months, net surplus has grown from $5.8M to $11.2M per month — a 93% increase. This trend is very positive and shows your business is becoming more efficient.", agent: "owner" },
  { role: "user", content: "What are the biggest risks in the next 3 months?", agent: "owner" },
  { role: "assistant", content: "Key risks to watch out for:\n\n1. **Unpaid invoice** ($12M) — if not collected, it could disrupt liquidity\n2. **Product concentration** — 68% from one category, vulnerable to market shifts\n3. **Rising raw material costs** — global trends suggest a potential 8-12% increase in Q2 2026\n\nRecommendation: prioritize invoice collection and start diversifying product lines.", agent: "owner" },
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
          <span className="font-semibold tabular-nums" style={{ color: p.color }}>{formatUSD(p.value)}</span>
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
        owner: "Based on simulation data, your business is in **excellent condition**. With the what-if scenario you set (price +10%, 2 new employees, market growth +15%), the 3-month net cashflow projection is **positive and growing**. Recommendation: continue with a planned expansion strategy.",
        supplier: "With an additional inventory budget of $3M/month, stock capacity increases by approximately 20%. Ensure contracts with key suppliers are extended at least 6 months ahead to lock in prices and avoid raw material cost fluctuations.",
        customer: "A 10% price increase is still within customer tolerance based on price elasticity analysis. The loyal customer segment (>60%) is not sensitive to price increases below 15%. Focus on increasing product value to maintain loyalty.",
        bank: "This business has a very strong financial profile for credit applications. With consistent positive cashflow and a structured expansion plan, this business qualifies for investment credit facilities up to $200M.",
        report: "Simulation summary: The what-if scenario shows positive projections with a total 3-month net cashflow of " + formatUSD(totalNet) + ". The main risk is rising operational costs from additional employees. Recommendation: execute expansion gradually.",
      };
      const reply = {
        role: "assistant" as const,
        content: responses[activeAgent] ?? "Analysis is being processed...",
        agent: activeAgent,
      };
      setChatMessages((prev) => [...prev, reply]);
      setIsSending(false);
    }, 1200);
  };

  const exportMutation = trpc.reports.generateDemoPitchDeck.useMutation();
  const handleExportPitchDeck = async () => {
    try {
      const pdfBuffer = await exportMutation.mutateAsync({
        businessName: "Maju Jaya Store",
        reportTitle: "SME Financial Report",
        seedText: DEMO_SEED,
        forecastMonths: 3,
        forecast: adjustedForecast,
        riskLevel: "low",
      });
      if (!pdfBuffer) throw new Error("No PDF data received");
      const arrayBuffer = pdfBuffer instanceof ArrayBuffer ? pdfBuffer : (pdfBuffer as any).buffer || pdfBuffer;
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fiswarm-demo-pitchdeck.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Pitch deck export failed:", err);
      alert("Failed to export pitch deck. Please try again.");
    }
  };

  const currentAgent = DEMO_AGENTS.find((a) => a.key === activeAgent) ?? DEMO_AGENTS[0];
  const visibleChat = chatMessages.filter((m) => m.agent === activeAgent);

  const kpis = [
    { label: "Total Revenue",     value: "$133.4M", sub: "Last 6 months",    icon: TrendingUp,   color: "text-[oklch(0.65_0.12_145)]", bg: "bg-[oklch(0.18_0.02_145)]/30" },
    { label: "Total Expenses",    value: "$84.6M",  sub: "Last 6 months",    icon: TrendingDown, color: "text-[oklch(0.60_0.18_25)]",  bg: "bg-[oklch(0.18_0.02_25)]/30" },
    { label: "Net Cashflow",      value: "$48.8M",  sub: "Positive surplus", icon: Wallet,       color: "text-primary",               bg: "bg-primary/10" },
    { label: "Pending Invoice",   value: "$12.0M",  sub: "1 active invoice",icon: FileText,     color: "text-[oklch(0.70_0.12_55)]",  bg: "bg-[oklch(0.18_0.02_55)]/30" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary">DEMO MODE</span>
          <span className="text-xs text-muted-foreground">— Sample data, no login required</span>
        </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
        </Button>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">FiSwarm — Quick Demo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Interactive demo of the SME financial intelligence platform powered by Swarm AI. All data is simulated.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
            <Play className="h-3.5 w-3.5 text-primary" />
            <span>Maju Jaya Store — Demo Business</span>
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
                    Income vs Expense (6 Months)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={DEMO_MONTHLY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatUSD} width={58} />
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
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatUSD} width={58} />
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
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Transactions</div>
                  <span className="text-[10px] text-muted-foreground">8 transactions</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-accent/10">
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-left">Date</th>
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-left">Description</th>
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-left">Type</th>
                        <th className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2 text-right">Amount</th>
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
                            {tx.type === "expense" ? "−" : "+"}{formatUSD(tx.amount)}
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
                  Continue to Seed Generator <ArrowRight className="h-3.5 w-3.5" />
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
                  The system extracts financial patterns from 6 months of transaction data and converts them into structured seed text for AI agents.
                </p>

                <div className="rounded-lg border border-[oklch(0.30_0.06_145)] bg-[oklch(0.18_0.02_145)]/20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.30_0.06_145)]/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[oklch(0.65_0.12_145)]" />
                      <span className="text-xs font-semibold text-[oklch(0.65_0.12_145)]">Seed Generated Successfully</span>
                      <span className="text-xs text-muted-foreground">— 8 transactions</span>
                    </div>
                    <button
                      onClick={() => setSeedExpanded(!seedExpanded)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {seedExpanded ? "Hide" : "View Seed Text"}
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
                    { label: "Total Transactions", value: "8" },
                    { label: "Data Period", value: "6 Months" },
                    { label: "Categories", value: "3 Types" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border bg-accent/10 p-3 text-center">
                      <div className="text-base font-bold text-primary tabular-nums">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <Button size="sm" className="w-full gap-1.5" onClick={() => setActiveTab("whatif")}>
                  Continue to What-if Scenarios <ArrowRight className="h-3.5 w-3.5" />
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
                    Active Scenario
                  </span>
                </div>

                {/* Price Change */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Price Change</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${priceChange > 0 ? "text-[oklch(0.65_0.12_145)]" : priceChange < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {priceChange > 0 ? "+" : ""}{priceChange}%
                    </span>
                  </div>
                  <Slider value={[priceChange]} onValueChange={([v]) => setPriceChange(v)} min={-30} max={50} step={5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="text-destructive/70">−30% (price drop)</span>
                    <span className="text-[oklch(0.65_0.12_145)]/70">+50% (price increase)</span>
                  </div>
                </div>

                {/* Employee */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Add Employees</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold tabular-nums">{employeeCount} person{employeeCount !== 1 ? "s" : ""}</span>
                      {employeeCount > 0 && <div className="text-[10px] text-destructive/80">+{formatUSD(employeeCount * 3_500_000)}/month</div>}
                    </div>
                  </div>
                  <Slider value={[employeeCount]} onValueChange={([v]) => setEmployeeCount(v)} min={0} max={10} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>0 employees</span><span>10 employees</span></div>
                </div>

                {/* Inventory */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Additional Inventory / Month</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{formatUSD(inventoryBudget)}</span>
                  </div>
                  <Slider value={[inventoryBudget]} onValueChange={([v]) => setInventoryBudget(v)} min={0} max={20_000_000} step={500_000} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>$0</span><span>$20M</span></div>
                </div>

                {/* Market Growth */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">Market Growth Assumption</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${marketGrowth > 0 ? "text-[oklch(0.65_0.12_145)]" : marketGrowth < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {marketGrowth > 0 ? "+" : ""}{marketGrowth}%
                    </span>
                  </div>
                  <Slider value={[marketGrowth]} onValueChange={([v]) => setMarketGrowth(v)} min={-20} max={30} step={5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span className="text-destructive/70">−20% (contraction)</span><span className="text-[oklch(0.65_0.12_145)]/70">+30% (growth)</span></div>
                </div>

                {/* Live preview */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="text-xs font-medium text-primary mb-3">Live Projection (3 Months)</div>
                  <div className="grid grid-cols-3 gap-3">
                    {adjustedForecast.map((row) => (
                      <div key={row.month} className="text-center">
                        <div className="text-[10px] text-muted-foreground mb-1">{row.month}</div>
                        <div className={`text-sm font-bold tabular-nums ${row.net >= 0 ? "text-primary" : "text-destructive"}`}>
                          {row.net >= 0 ? "+" : ""}{formatUSD(row.net)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">net</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">3-month total:</span>
                    <span className={`text-sm font-bold tabular-nums ${totalNet >= 0 ? "text-primary" : "text-destructive"}`}>
                      {totalNet >= 0 ? "+" : ""}{formatUSD(totalNet)}
                    </span>
                  </div>
                </div>

                <Button size="sm" className="w-full gap-1.5" onClick={() => setActiveTab("forecast")}>
                  View Full Forecast <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: Forecast ──────────────────────────────────────────────── */}
          <TabsContent value="forecast" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Projected Revenue",   value: formatUSD(adjustedForecast.reduce((s,r)=>s+r.income,0)), color: "text-[oklch(0.65_0.12_145)]" },
                { label: "Projected Expenses",   value: formatUSD(adjustedForecast.reduce((s,r)=>s+r.expense,0)), color: "text-[oklch(0.60_0.18_25)]" },
                { label: "3-Month Net Cashflow", value: (totalNet>=0?"+":"")+formatUSD(totalNet), color: totalNet>=0?"text-primary":"text-destructive" },
                { label: "Avg Confidence",        value: "82%", color: "text-muted-foreground" },
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
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Projected Income vs Expense</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={adjustedForecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatUSD} width={58} />
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
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatUSD} width={58} />
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
                      {["Month","Revenue","Expenses","Net","Confidence"].map((h,i) => (
                        <th key={h} className={`text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 ${i===0?"text-left":"text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {adjustedForecast.map((row, i) => (
                      <tr key={row.month} className={`border-b border-border/40 hover:bg-accent/20 ${i%2===0?"":"bg-accent/5"}`}>
                        <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-[oklch(0.65_0.12_145)]">{formatUSD(row.income)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums text-right text-[oklch(0.60_0.18_25)]">{formatUSD(row.expense)}</td>
                        <td className={`px-4 py-3 text-sm tabular-nums text-right font-bold ${row.net>=0?"text-primary":"text-destructive"}`}>
                          {row.net>=0?"+":""}{formatUSD(row.net)}
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
                      <span className="text-muted-foreground ml-auto text-[10px]">Demo — instant responses</span>
            </div>

            {/* Messages */}
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {visibleChat.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Start a conversation with the {currentAgent.label} Agent
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
                    placeholder={`Ask the ${currentAgent.label} agent...`}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 transition-colors"
                  />
                  <Button size="sm" onClick={handleDemoChat} disabled={isSending || !chatInput.trim()}>
                    Send
                  </Button>
                </div>
                {/* Suggested prompts */}
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {[
                    "How is the cashflow?",
                    "What are the biggest risks?",
                    "Recommendations for expansion?",
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
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => handleExportPitchDeck()} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Pitch Deck
              </Button>
            </div>
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-accent/10">
                  <div>
                    <div className="text-sm font-semibold">SME Financial Report</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Sep 2025 – Feb 2026 · Generated by FiSwarm AI</div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded border border-[oklch(0.30_0.06_145)] bg-[oklch(0.18_0.02_145)]/40 text-[oklch(0.65_0.12_145)] font-medium">
                    COMPLETE
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
