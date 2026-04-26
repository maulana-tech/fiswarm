import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import {
  ArrowLeft, FileText, Loader2, AlertTriangle, CheckCircle,
  Info, TrendingUp, TrendingDown, Minus, BarChart3,
  MessageSquare, Users, ShieldAlert, ChevronRight,
} from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";

interface Props { id: number; }

function formatUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatUSDFull(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const AGENTS = [
  {
    key: "owner",
    label: "Owner",
    shortDesc: "Business owner",
    color: "oklch(0.72 0.14 195)",
    bg: "oklch(0.18 0.02 195)",
    border: "oklch(0.30 0.06 195)",
    prompts: [
      "What is the current cashflow status of my business?",
      "What strategies can increase revenue?",
      "Do I need to hire more employees?",
    ],
  },
  {
    key: "supplier",
    label: "Supplier",
    shortDesc: "Supply chain",
    color: "oklch(0.70 0.12 55)",
    bg: "oklch(0.18 0.02 55)",
    border: "oklch(0.30 0.06 55)",
    prompts: [
      "Are supplier payments being made on time?",
      "What is the current stock and procurement status?",
      "What are the supply chain risks?",
    ],
  },
  {
    key: "customer",
    label: "Customer",
    shortDesc: "Customer demand",
    color: "oklch(0.65 0.12 145)",
    bg: "oklch(0.18 0.02 145)",
    border: "oklch(0.30 0.06 145)",
    prompts: [
      "What are the current customer demand trends?",
      "Is the product pricing still competitive?",
      "What factors affect customer loyalty?",
    ],
  },
  {
    key: "bank",
    label: "Bank",
    shortDesc: "Financial health",
    color: "oklch(0.65 0.12 280)",
    bg: "oklch(0.18 0.02 280)",
    border: "oklch(0.30 0.06 280)",
    prompts: [
      "Is this business eligible for a loan?",
      "What are the key financial ratios of this business?",
      "What are the banking recommendations?",
    ],
  },
  {
    key: "report",
    label: "Report Agent",
    shortDesc: "AI analyst",
    color: "oklch(0.70 0.10 320)",
    bg: "oklch(0.18 0.02 320)",
    border: "oklch(0.30 0.06 320)",
    prompts: [
      "Summarize the financial condition of this business.",
      "What are the key takeaways from the simulation?",
      "Provide a prioritized action plan.",
    ],
  },
] as const;

type AgentKey = typeof AGENTS[number]["key"];

const riskConfig = {
  critical: {
    icon: AlertTriangle,
    label: "CRITICAL",
    textColor: "text-[oklch(0.55_0.22_25)]",
    bgColor: "bg-[oklch(0.16_0.04_25)]/50",
    borderColor: "border-[oklch(0.35_0.10_25)]",
    badgeBg: "bg-[oklch(0.16_0.04_25)] text-[oklch(0.55_0.22_25)] border-[oklch(0.35_0.10_25)]",
  },
  high: {
    icon: AlertTriangle,
    label: "HIGH",
    textColor: "text-[oklch(0.60_0.18_25)]",
    bgColor: "bg-[oklch(0.18_0.02_25)]/40",
    borderColor: "border-[oklch(0.30_0.08_25)]",
    badgeBg: "bg-[oklch(0.18_0.02_25)] text-[oklch(0.60_0.18_25)] border-[oklch(0.30_0.08_25)]",
  },
  medium: {
    icon: Info,
    label: "MEDIUM",
    textColor: "text-[oklch(0.70_0.12_55)]",
    bgColor: "bg-[oklch(0.18_0.02_55)]/40",
    borderColor: "border-[oklch(0.30_0.06_55)]",
    badgeBg: "bg-[oklch(0.18_0.02_55)] text-[oklch(0.70_0.12_55)] border-[oklch(0.30_0.06_55)]",
  },
  low: {
    icon: CheckCircle,
    label: "LOW",
    textColor: "text-[oklch(0.65_0.12_145)]",
    bgColor: "bg-[oklch(0.18_0.02_145)]/40",
    borderColor: "border-[oklch(0.30_0.06_145)]",
    badgeBg: "bg-[oklch(0.18_0.02_145)] text-[oklch(0.65_0.12_145)] border-[oklch(0.30_0.06_145)]",
  },
};

const overallRiskBadge: Record<string, string> = {
  low:      "bg-[oklch(0.18_0.02_145)] text-[oklch(0.65_0.12_145)] border-[oklch(0.30_0.06_145)]",
  medium:   "bg-[oklch(0.18_0.02_55)]  text-[oklch(0.70_0.12_55)]  border-[oklch(0.30_0.06_55)]",
  high:     "bg-[oklch(0.18_0.02_25)]  text-[oklch(0.60_0.18_25)]  border-[oklch(0.30_0.08_25)]",
  critical: "bg-[oklch(0.16_0.04_25)]  text-[oklch(0.55_0.22_25)]  border-[oklch(0.35_0.10_25)]",
};

// Custom tooltip for charts
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

export default function SimulationDetail({ id }: Props) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [activeAgent, setActiveAgent] = useState<AgentKey>("owner");
  const [activeTab, setActiveTab] = useState("forecast");

  const { data: sim, isLoading } = trpc.simulations.get.useQuery({ id });
  const { data: logs } = trpc.agentChat.getLogs.useQuery({ simulationId: id });

  const chatMutation = trpc.agentChat.sendMessage.useMutation({
    onSuccess: () => utils.agentChat.getLogs.invalidate({ simulationId: id }),
    onError: (e) => toast.error(e.message),
  });

  const reportMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      utils.reports.list.invalidate();
      toast.success("Report generated successfully!");
      setLocation(`/reports/${data.reportId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded bg-accent animate-pulse" />
          <div className="h-5 w-48 rounded bg-accent animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />)}
        </div>
        <div className="h-64 rounded-lg border border-border bg-card animate-pulse" />
      </div>
    );
  }

  if (!sim) {
    return (
      <div className="p-6 text-center">
        <div className="text-muted-foreground text-sm">Simulation not found.</div>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => setLocation("/simulation")}>
          Back to Simulations
        </Button>
      </div>
    );
  }

  const forecast = (sim.cashflowForecast as Array<{ month: string; income: number; expense: number; net: number; confidence: number }>) ?? [];
  const alerts = (sim.riskAlerts as Array<{ severity: string; title: string; description: string }>) ?? [];
  const insights = (sim.agentInsights as Record<string, string>) ?? {};
  const params = (sim.scenarioParams as Record<string, number>) ?? {};

  // Compute summary stats
  const totalIncome = forecast.reduce((s, r) => s + r.income, 0);
  const totalExpense = forecast.reduce((s, r) => s + r.expense, 0);
  const totalNet = forecast.reduce((s, r) => s + r.net, 0);
  const avgConfidence = forecast.length ? Math.round(forecast.reduce((s, r) => s + r.confidence, 0) / forecast.length) : 0;

  const currentAgent = AGENTS.find((a) => a.key === activeAgent)!;
  const agentMessages: Message[] = [
    {
      role: "system",
      content: `You are the ${currentAgent.label} agent in a FiSwarm swarm simulation for an SME business.`,
    },
    ...(logs ?? [])
      .filter((l) => l.agentType === activeAgent)
      .map((l) => ({
        role: (l.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: l.content,
      })),
  ];

  const handleSend = (content: string) => {
    if (!content.trim()) return;
    chatMutation.mutate({ simulationId: id, agentType: activeAgent, message: content });
  };

  const hasScenario = Object.values(params).some((v) => v !== 0);

  return (
    <div className="p-6 space-y-5 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => setLocation("/simulation")}
          className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight truncate">{sim.title}</h1>
            {sim.riskLevel && (
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${overallRiskBadge[sim.riskLevel] ?? ""}`}>
                {sim.riskLevel.toUpperCase()} RISK
              </span>
            )}
            {sim.status === "running" && (
              <span className="text-xs px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Running
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">{sim.forecastMonths}-month forecast</span>
            {hasScenario && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {params.priceChange !== 0 && `Price ${params.priceChange > 0 ? "+" : ""}${params.priceChange}%`}
                {params.employeeCount > 0 && ` · +${params.employeeCount} employees`}
                {params.inventoryBudget > 0 && ` · Inventory +${formatUSD(params.inventoryBudget)}/mo`}
                {params.marketGrowth !== 0 && ` · Market ${params.marketGrowth > 0 ? "+" : ""}${params.marketGrowth}%`}
              </span>
            )}
          </div>
        </div>
        {sim.status === "completed" && (
          <Button
            size="sm"
            onClick={() => reportMutation.mutate({ simulationId: id })}
            disabled={reportMutation.isPending}
          >
            {reportMutation.isPending
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...</>
              : <><FileText className="h-3.5 w-3.5 mr-1.5" /> Generate Report</>
            }
          </Button>
        )}
      </div>

      {/* ── Running state ────────────────────────────────────────────────────── */}
      {sim.status === "running" && (
        <Card className="bg-card border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <div className="text-sm font-semibold">Simulation in progress</div>
                <div className="text-xs text-muted-foreground">4 agents are analyzing your financial data...</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AGENTS.filter(a => a.key !== "report").map((a, i) => (
                <div key={a.key} className="flex items-center gap-2 px-3 py-2 rounded border border-border bg-accent/10">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: a.color, animationDelay: `${i * 150}ms` }} />
                  <span className="text-xs" style={{ color: a.color }}>{a.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Failed state ─────────────────────────────────────────────────────── */}
      {sim.status === "failed" && (
        <Card className="bg-card border-destructive/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <div className="text-sm font-semibold text-destructive mb-1">Simulation Failed</div>
            <div className="text-xs text-muted-foreground mb-4">An error occurred. Please try again with a different configuration.</div>
            <Button size="sm" variant="outline" onClick={() => setLocation("/simulation")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Completed: KPI summary row ───────────────────────────────────────── */}
      {sim.status === "completed" && forecast.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Projected Income",
              value: formatUSD(totalIncome),
              sub: `${sim.forecastMonths} months`,
              icon: TrendingUp,
              color: "text-[oklch(0.65_0.12_145)]",
              bg: "bg-[oklch(0.18_0.02_145)]/30",
            },
            {
              label: "Total Projected Expense",
              value: formatUSD(totalExpense),
              sub: `${sim.forecastMonths} months`,
              icon: TrendingDown,
              color: "text-[oklch(0.60_0.18_25)]",
              bg: "bg-[oklch(0.18_0.02_25)]/30",
            },
            {
              label: "Net Cashflow",
              value: (totalNet >= 0 ? "+" : "") + formatUSD(totalNet),
              sub: totalNet >= 0 ? "Positive" : "Negative",
              icon: totalNet >= 0 ? TrendingUp : TrendingDown,
              color: totalNet >= 0 ? "text-primary" : "text-destructive",
              bg: totalNet >= 0 ? "bg-primary/10" : "bg-destructive/10",
            },
            {
              label: "Avg. Confidence",
              value: `${avgConfidence}%`,
              sub: "AI prediction",
              icon: BarChart3,
              color: "text-muted-foreground",
              bg: "bg-accent/30",
            },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className={`w-7 h-7 rounded flex items-center justify-center mb-2.5 ${kpi.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                  <div className={`text-base font-semibold tabular-nums ${kpi.color}`}>{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
                  <div className="text-[10px] text-muted-foreground/60">{kpi.sub}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Completed: Tabbed content ─────────────────────────────────────────── */}
      {sim.status === "completed" && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger value="forecast" className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-1.5 text-xs">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Risk Alerts</span>
              {alerts.filter(a => a.severity === "critical" || a.severity === "high").length > 0 && (
                <span className="ml-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
                  {alerts.filter(a => a.severity === "critical" || a.severity === "high").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: Forecast ─────────────────────────────────────────────────── */}
          <TabsContent value="forecast" className="space-y-4">
            {forecast.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  No forecast data available.
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Income vs Expense */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Income vs Expense
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={forecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatUSD} width={58} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="income" name="Income" fill="oklch(0.65 0.12 145)" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="expense" name="Expense" fill="oklch(0.60 0.18 25)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-4 mt-3 justify-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm bg-[oklch(0.65_0.12_145)]" />
                          <span className="text-[10px] text-muted-foreground">Income</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-sm bg-[oklch(0.60_0.18_25)]" />
                          <span className="text-[10px] text-muted-foreground">Expense</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Net Cashflow */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                        Net Cashflow Projection
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={forecast} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="netPos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.006 240)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "oklch(0.50 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatUSD} width={58} />
                          <ReferenceLine y={0} stroke="oklch(0.55 0.15 25)" strokeDasharray="4 4" strokeWidth={1.5} />
                          <Tooltip content={<ChartTooltip />} />
                          <Area
                            dataKey="net"
                            name="Net Cashflow"
                            stroke="oklch(0.72 0.14 195)"
                            strokeWidth={2}
                            fill="url(#netPos)"
                            dot={{ fill: "oklch(0.72 0.14 195)", r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "oklch(0.72 0.14 195)" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly breakdown table */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Breakdown</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-accent/10">
                            <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-left">Month</th>
                            <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Income</th>
                            <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Expense</th>
                            <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Net</th>
                            <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Confidence</th>
                          </tr>
                        </thead>
                        <tbody>
                          {forecast.map((row, i) => (
                            <tr key={row.month} className={`border-b border-border/40 hover:bg-accent/20 transition-colors ${i % 2 === 0 ? "" : "bg-accent/5"}`}>
                              <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                              <td className="px-4 py-3 text-sm tabular-nums text-right text-[oklch(0.65_0.12_145)]">{formatUSD(row.income)}</td>
                              <td className="px-4 py-3 text-sm tabular-nums text-right text-[oklch(0.60_0.18_25)]">{formatUSD(row.expense)}</td>
                              <td className={`px-4 py-3 text-sm tabular-nums text-right font-semibold ${row.net >= 0 ? "text-primary" : "text-destructive"}`}>
                                <span className="flex items-center justify-end gap-1">
                                  {row.net >= 0
                                    ? <TrendingUp className="h-3 w-3" />
                                    : <TrendingDown className="h-3 w-3" />
                                  }
                                  {row.net >= 0 ? "+" : ""}{formatUSD(row.net)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-accent overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-primary/60"
                                      style={{ width: `${row.confidence}%` }}
                                    />
                                  </div>
                                  <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{row.confidence}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-border bg-accent/10">
                            <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</td>
                            <td className="px-4 py-3 text-sm tabular-nums text-right font-semibold text-[oklch(0.65_0.12_145)]">{formatUSD(totalIncome)}</td>
                            <td className="px-4 py-3 text-sm tabular-nums text-right font-semibold text-[oklch(0.60_0.18_25)]">{formatUSD(totalExpense)}</td>
                            <td className={`px-4 py-3 text-sm tabular-nums text-right font-bold ${totalNet >= 0 ? "text-primary" : "text-destructive"}`}>
                              {totalNet >= 0 ? "+" : ""}{formatUSD(totalNet)}
                            </td>
                            <td className="px-4 py-3 text-xs tabular-nums text-right text-muted-foreground">{avgConfidence}% avg</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── TAB: Risk Alerts ──────────────────────────────────────────────── */}
          <TabsContent value="risk" className="space-y-3">
            {alerts.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-8 w-8 text-[oklch(0.65_0.12_145)] mx-auto mb-3" />
                  <div className="text-sm font-medium">No risk alerts</div>
                  <div className="text-xs text-muted-foreground mt-1">Your cashflow forecast looks healthy.</div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Risk summary */}
                <div className="grid grid-cols-4 gap-2">
                  {(["critical", "high", "medium", "low"] as const).map((level) => {
                    const count = alerts.filter(a => a.severity === level).length;
                    const cfg = riskConfig[level];
                    const Icon = cfg.icon;
                    return (
                      <div key={level} className={`rounded-lg border p-3 text-center ${count > 0 ? `${cfg.bgColor} ${cfg.borderColor}` : "border-border bg-card opacity-40"}`}>
                        <Icon className={`h-4 w-4 mx-auto mb-1 ${count > 0 ? cfg.textColor : "text-muted-foreground"}`} />
                        <div className={`text-lg font-bold tabular-nums ${count > 0 ? cfg.textColor : "text-muted-foreground"}`}>{count}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{cfg.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Alert cards */}
                <div className="space-y-2">
                  {alerts.map((alert, i) => {
                    const cfg = riskConfig[alert.severity as keyof typeof riskConfig] ?? riskConfig.medium;
                    const Icon = cfg.icon;
                    return (
                      <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${cfg.bgColor} ${cfg.borderColor}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bgColor} border ${cfg.borderColor}`}>
                          <Icon className={`h-4 w-4 ${cfg.textColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">{alert.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${cfg.badgeBg}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── TAB: Agent Insights ───────────────────────────────────────────── */}
          <TabsContent value="agents" className="space-y-3">
            {Object.keys(insights).length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground text-sm">
                  No agent insights available.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {AGENTS.filter((a) => a.key !== "report" && insights[a.key]).map((agent) => (
                  <Card key={agent.key} className="bg-card border-border overflow-hidden">
                    <CardContent className="p-0">
                      <div
                        className="flex items-center gap-3 px-4 py-3 border-b"
                        style={{ borderColor: agent.border, background: agent.bg + "33" }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: agent.bg, color: agent.color, border: `1px solid ${agent.border}` }}
                        >
                          {agent.label[0]}
                        </div>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: agent.color }}>{agent.label} Agent</div>
                          <div className="text-[10px] text-muted-foreground">{agent.shortDesc}</div>
                        </div>
                        <button
                          className="ml-auto text-[10px] px-2 py-1 rounded border transition-colors hover:opacity-80"
                          style={{ borderColor: agent.border, color: agent.color, background: agent.bg }}
                          onClick={() => { setActiveAgent(agent.key as AgentKey); setActiveTab("chat"); }}
                        >
                          Chat
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-muted-foreground leading-relaxed">{insights[agent.key]}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── TAB: Chat with Agent ──────────────────────────────────────────── */}
          <TabsContent value="chat" className="space-y-3">
            {/* Agent selector */}
            <div className="flex flex-wrap gap-2">
              {AGENTS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setActiveAgent(a.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    activeAgent === a.key
                      ? "border-current"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                  style={activeAgent === a.key ? {
                    color: a.color,
                    background: a.bg,
                    borderColor: a.border,
                  } : {}}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                    style={activeAgent === a.key ? { background: a.border, color: a.color } : { background: "oklch(0.22 0.006 240)", color: "oklch(0.55 0.008 240)" }}
                  >
                    {a.label[0]}
                  </div>
                  {a.label}
                </button>
              ))}
            </div>

            {/* Agent info bar */}
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs"
              style={{ borderColor: currentAgent.border, background: currentAgent.bg + "44", color: currentAgent.color }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px]" style={{ background: currentAgent.border }}>
                {currentAgent.label[0]}
              </div>
              <span className="font-semibold">{currentAgent.label} Agent</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{currentAgent.shortDesc}</span>
            </div>

            {/* Chat box */}
            <AIChatBox
              messages={agentMessages}
              onSendMessage={handleSend}
              isLoading={chatMutation.isPending}
              placeholder={`Ask the ${currentAgent.label} agent...`}
              height={400}
              emptyStateMessage={`Start a conversation with the ${currentAgent.label} agent`}
              suggestedPrompts={currentAgent.prompts as unknown as string[]}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
