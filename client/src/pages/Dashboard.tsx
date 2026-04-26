import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Activity, Plus, BrainCircuit } from "lucide-react";
import { useMemo } from "react";

function formatUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: kpis, isLoading: kpiLoading } = trpc.transactions.kpis.useQuery();
  const { data: trends, isLoading: trendsLoading } = trpc.transactions.monthlyTrends.useQuery({ months: 6 });
  const { data: simulations } = trpc.simulations.list.useQuery();

  // Build chart data from monthly trends
  const chartData = useMemo(() => {
    if (!trends) return [];
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    for (const row of trends) {
      if (!map[row.month]) map[row.month] = { month: row.month, income: 0, expense: 0 };
      if (row.type === "income") map[row.month].income = parseFloat(row.total ?? "0");
      if (row.type === "expense") map[row.month].expense = parseFloat(row.total ?? "0");
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [trends]);

  const netData = chartData.map((d) => ({
    month: d.month,
    net: d.income - d.expense,
  }));

  const latestSim = simulations?.[0];

  const kpiCards = [
    {
      label: "Total Income",
      value: kpis ? formatUSD(kpis.totalIncome) : "—",
      icon: TrendingUp,
      color: "text-[oklch(0.65_0.12_145)]",
    },
    {
      label: "Total Expense",
      value: kpis ? formatUSD(kpis.totalExpense) : "—",
      icon: TrendingDown,
      color: "text-[oklch(0.60_0.18_25)]",
    },
    {
      label: "Net Balance",
      value: kpis ? formatUSD(kpis.balance) : "—",
      icon: Wallet,
      color: kpis && kpis.balance >= 0 ? "text-primary" : "text-destructive",
    },
    {
      label: "Pending Invoices",
      value: kpis ? formatUSD(kpis.totalInvoice) : "—",
      icon: Activity,
      color: "text-[oklch(0.70_0.12_55)]",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Financial overview and cashflow summary</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setLocation("/transactions")}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Transaction
          </Button>
          <Button size="sm" onClick={() => setLocation("/simulation")}>
            <BrainCircuit className="h-3.5 w-3.5 mr-1.5" />
            Run Simulation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{card.label}</span>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className={`text-xl font-bold font-num ${card.color}`}>
                {kpiLoading ? <span className="text-muted-foreground text-sm">Loading...</span> : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expense */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Income vs Expense (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {trendsLoading ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
            ) : chartData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">No transaction data yet</span>
                <Button size="sm" variant="outline" onClick={() => setLocation("/transactions")}>
                  Add Transactions
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.008 240)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatUSD(v)} width={60} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.16 0.006 240)", border: "1px solid oklch(0.24 0.008 240)", borderRadius: 4, fontSize: 12 }}
                    formatter={(v: number) => formatUSD(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" name="Income" fill="oklch(0.65 0.12 145)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="oklch(0.60 0.18 25)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Net Cashflow */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Net Cashflow Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {trendsLoading ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
            ) : netData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={netData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="oklch(0.72 0.14 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0.008 240)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.008 240)" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatUSD(v)} width={60} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.16 0.006 240)", border: "1px solid oklch(0.24 0.008 240)", borderRadius: 4, fontSize: 12 }}
                    formatter={(v: number) => formatUSD(v)}
                  />
                  <Area dataKey="net" name="Net Cashflow" stroke="oklch(0.72 0.14 195)" strokeWidth={2} fill="url(#netGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest simulation summary */}
      {latestSim && latestSim.status === "completed" && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Latest Simulation
              </CardTitle>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setLocation(`/simulation/${latestSim.id}`)}>
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="font-medium text-sm">{latestSim.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {latestSim.forecastMonths}-month forecast
                </div>
              </div>
              <div className="ml-auto">
                <span className={`text-xs border px-2 py-0.5 rounded font-medium risk-${latestSim.riskLevel ?? "low"}`}>
                  {(latestSim.riskLevel ?? "low").toUpperCase()} RISK
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state CTA */}
      {!kpiLoading && kpis && kpis.totalIncome === 0 && kpis.totalExpense === 0 && (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-8 text-center">
            <div className="text-sm font-medium mb-1">No transactions yet</div>
            <div className="text-xs text-muted-foreground mb-4">
              Start by adding your income and expense records to enable cashflow analysis.
            </div>
            <Button size="sm" onClick={() => setLocation("/transactions")}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add First Transaction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
