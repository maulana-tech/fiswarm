import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ArrowLeft, FileText, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";

interface Props { id: number; }

function formatIDR(n: number) {
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${n.toFixed(0)}`;
}

const AGENTS = [
  { key: "owner", label: "Owner", desc: "Business owner perspective" },
  { key: "supplier", label: "Supplier", desc: "Supply chain perspective" },
  { key: "customer", label: "Customer", desc: "Customer behavior perspective" },
  { key: "bank", label: "Bank", desc: "Financial institution perspective" },
  { key: "report", label: "Report Agent", desc: "AI financial analyst" },
] as const;

type AgentKey = typeof AGENTS[number]["key"];

const alertIcon = {
  critical: <AlertTriangle className="h-4 w-4 text-[oklch(0.55_0.22_25)]" />,
  high: <AlertTriangle className="h-4 w-4 text-[oklch(0.60_0.18_25)]" />,
  medium: <Info className="h-4 w-4 text-[oklch(0.70_0.12_55)]" />,
  low: <CheckCircle className="h-4 w-4 text-[oklch(0.65_0.12_145)]" />,
};

export default function SimulationDetail({ id }: Props) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [activeAgent, setActiveAgent] = useState<AgentKey>("owner");

  const { data: sim, isLoading } = trpc.simulations.get.useQuery({ id });
  const { data: logs } = trpc.agentChat.getLogs.useQuery({ simulationId: id });

  const chatMutation = trpc.agentChat.sendMessage.useMutation({
    onSuccess: () => {
      utils.agentChat.getLogs.invalidate({ simulationId: id });
    },
    onError: (e) => toast.error(e.message),
  });

  const reportMutation = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      utils.reports.list.invalidate();
      toast.success("Report generated");
      setLocation(`/reports/${data.reportId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading simulation...
      </div>
    );
  }
  if (!sim) {
    return <div className="p-6 text-muted-foreground">Simulation not found.</div>;
  }

  const forecast = (sim.cashflowForecast as Array<{ month: string; income: number; expense: number; net: number; confidence: number }>) ?? [];
  const alerts = (sim.riskAlerts as Array<{ severity: string; title: string; description: string }>) ?? [];
  const insights = (sim.agentInsights as Record<string, string>) ?? {};
  const params = (sim.scenarioParams as Record<string, number>) ?? {};

  // Build AIChatBox-compatible messages from persisted logs
  const agentMessages: Message[] = [
    {
      role: "system",
      content: `You are the ${AGENTS.find((a) => a.key === activeAgent)?.label} agent in a MiroFish swarm simulation for an Indonesian UMKM business.`,
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

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/simulation")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">{sim.title}</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">{sim.forecastMonths}-month forecast</span>
            {sim.riskLevel && (
              <span className={`text-xs border px-2 py-0.5 rounded font-medium risk-${sim.riskLevel}`}>
                {sim.riskLevel.toUpperCase()} RISK
              </span>
            )}
          </div>
        </div>
        {sim.status === "completed" && (
          <Button size="sm" variant="outline" onClick={() => reportMutation.mutate({ simulationId: id })} disabled={reportMutation.isPending}>
            {reportMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <FileText className="h-3.5 w-3.5 mr-1.5" />}
            Generate Report
          </Button>
        )}
      </div>

      {sim.status === "running" && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <div className="text-sm font-medium">Simulation in progress...</div>
              <div className="text-xs text-muted-foreground">Agents are analyzing your financial data</div>
            </div>
          </CardContent>
        </Card>
      )}

      {sim.status === "completed" && (
        <>
          {/* Scenario params summary */}
          {Object.keys(params).some((k) => (params[k] ?? 0) !== 0) && (
            <Card className="bg-card border-border">
              <CardContent className="px-4 py-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scenario Parameters Applied</div>
                <div className="flex flex-wrap gap-4">
                  {params.priceChange !== 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Price: </span>
                      <span className={params.priceChange > 0 ? "text-[oklch(0.65_0.12_145)]" : "text-destructive"}>
                        {params.priceChange > 0 ? "+" : ""}{params.priceChange}%
                      </span>
                    </div>
                  )}
                  {params.employeeCount > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">New Employees: </span>
                      <span className="text-foreground">+{params.employeeCount}</span>
                    </div>
                  )}
                  {params.inventoryBudget > 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Inventory: </span>
                      <span className="text-foreground">+{formatIDR(params.inventoryBudget)}/mo</span>
                    </div>
                  )}
                  {params.marketGrowth !== 0 && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Market Growth: </span>
                      <span className={params.marketGrowth > 0 ? "text-[oklch(0.65_0.12_145)]" : "text-destructive"}>
                        {params.marketGrowth > 0 ? "+" : ""}{params.marketGrowth}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forecast Charts */}
          {forecast.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cashflow Forecast — Income vs Expense
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={forecast} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.008 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatIDR} width={60} />
                      <Tooltip contentStyle={{ background: "oklch(0.16 0.006 240)", border: "1px solid oklch(0.24 0.008 240)", borderRadius: 4, fontSize: 12 }} formatter={(v: number) => formatIDR(v)} />
                      <Bar dataKey="income" name="Income" fill="oklch(0.65 0.12 145)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="oklch(0.60 0.18 25)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Net Cashflow Projection
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={forecast} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="netForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.008 240)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={formatIDR} width={60} />
                      <ReferenceLine y={0} stroke="oklch(0.60 0.18 25)" strokeDasharray="4 4" />
                      <Tooltip contentStyle={{ background: "oklch(0.16 0.006 240)", border: "1px solid oklch(0.24 0.008 240)", borderRadius: 4, fontSize: 12 }} formatter={(v: number) => formatIDR(v)} />
                      <Area dataKey="net" name="Net Cashflow" stroke="oklch(0.72 0.14 195)" strokeWidth={2} fill="url(#netForecast)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Forecast table */}
          {forecast.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Monthly Forecast Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-left">Month</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Income</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Expense</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Net</th>
                      <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.map((row) => (
                      <tr key={row.month} className="border-b border-border/50 hover:bg-accent/20">
                        <td className="px-4 py-3 text-sm font-num">{row.month}</td>
                        <td className="px-4 py-3 text-sm font-num text-right text-[oklch(0.65_0.12_145)]">{formatIDR(row.income)}</td>
                        <td className="px-4 py-3 text-sm font-num text-right text-[oklch(0.60_0.18_25)]">{formatIDR(row.expense)}</td>
                        <td className={`px-4 py-3 text-sm font-num text-right font-medium ${row.net >= 0 ? "text-primary" : "text-destructive"}`}>
                          {row.net >= 0 ? "+" : ""}{formatIDR(row.net)}
                        </td>
                        <td className="px-4 py-3 text-sm font-num text-right text-muted-foreground">{row.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Risk Alerts */}
          {alerts.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Risk Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {alerts.map((alert, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded border risk-${alert.severity}`}>
                    {alertIcon[alert.severity as keyof typeof alertIcon] ?? alertIcon.medium}
                    <div>
                      <div className="text-xs font-semibold">{alert.title}</div>
                      <div className="text-xs mt-0.5 opacity-80">{alert.description}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Agent Insights */}
          {Object.keys(insights).length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Agent Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {AGENTS.filter((a) => a.key !== "report" && insights[a.key]).map((agent) => (
                    <div key={agent.key} className="border border-border rounded p-3">
                      <div className={`text-xs font-semibold uppercase tracking-wider mb-2 agent-${agent.key}`}>
                        {agent.label}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insights[agent.key]}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat with Agent */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Chat with Agent
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Ask questions directly to the simulated agents
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* Agent selector */}
              <div className="flex flex-wrap gap-1">
                {AGENTS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setActiveAgent(a.key)}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                      activeAgent === a.key
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <AIChatBox
                messages={agentMessages}
                onSendMessage={handleSend}
                isLoading={chatMutation.isPending}
                placeholder={`Ask the ${AGENTS.find((a) => a.key === activeAgent)?.label} agent...`}
                height={320}
                emptyStateMessage={`Start a conversation with the ${AGENTS.find((a) => a.key === activeAgent)?.label} agent`}
                suggestedPrompts={[
                  "Bagaimana kondisi cashflow bisnis saya?",
                  "Apa risiko terbesar dalam 3 bulan ke depan?",
                  "Apa rekomendasi untuk meningkatkan pendapatan?",
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}

      {sim.status === "failed" && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <div className="text-sm font-medium text-destructive mb-1">Simulation Failed</div>
            <div className="text-xs text-muted-foreground">An error occurred during simulation. Please try again.</div>
            <Button size="sm" className="mt-4" onClick={() => setLocation("/simulation")}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
