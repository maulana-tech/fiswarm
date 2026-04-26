import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Database, SlidersHorizontal, Rocket, ChevronRight,
  CheckCircle, XCircle, Loader2, Clock, ArrowRight,
  TrendingUp, TrendingDown, Users, Package, BarChart3,
  RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

function formatUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const STEPS = [
  { id: 1, icon: Database, label: "Data Seed", desc: "Extract financial patterns" },
  { id: 2, icon: SlidersHorizontal, label: "Scenarios", desc: "Set what-if variables" },
  { id: 3, icon: Rocket, label: "Launch", desc: "Configure & run agents" },
] as const;

const AGENTS = [
  {
    key: "owner",
    label: "Owner",
    color: "oklch(0.72 0.14 195)",
    bg: "oklch(0.18 0.02 195)",
    desc: "Analyzes business decisions, growth strategy, and operational costs from the owner's perspective.",
  },
  {
    key: "supplier",
    label: "Supplier",
    color: "oklch(0.70 0.12 55)",
    bg: "oklch(0.18 0.02 55)",
    desc: "Evaluates supply chain health, payment terms, and procurement risks.",
  },
  {
    key: "customer",
    label: "Customer",
    color: "oklch(0.65 0.12 145)",
    bg: "oklch(0.18 0.02 145)",
    desc: "Models customer demand, price sensitivity, and purchasing behavior.",
  },
  {
    key: "bank",
    label: "Bank",
    color: "oklch(0.65 0.12 280)",
    bg: "oklch(0.18 0.02 280)",
    desc: "Assesses creditworthiness, loan eligibility, and financial risk from a banking perspective.",
  },
];

const statusConfig = {
  pending:   { icon: Clock,        color: "text-muted-foreground",          label: "Pending"   },
  running:   { icon: Loader2,      color: "text-primary animate-spin",      label: "Running"   },
  completed: { icon: CheckCircle,  color: "text-[oklch(0.65_0.12_145)]",    label: "Completed" },
  failed:    { icon: XCircle,      color: "text-destructive",               label: "Failed"    },
};

const riskBadge: Record<string, string> = {
  low:      "bg-[oklch(0.18_0.02_145)] text-[oklch(0.65_0.12_145)] border-[oklch(0.30_0.06_145)]",
  medium:   "bg-[oklch(0.18_0.02_55)]  text-[oklch(0.70_0.12_55)]  border-[oklch(0.30_0.06_55)]",
  high:     "bg-[oklch(0.18_0.02_25)]  text-[oklch(0.60_0.18_25)]  border-[oklch(0.30_0.08_25)]",
  critical: "bg-[oklch(0.16_0.04_25)]  text-[oklch(0.55_0.22_25)]  border-[oklch(0.28_0.10_25)]",
};

export default function Simulation() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Seed
  const [seedMonths, setSeedMonths] = useState(6);
  const [seedText, setSeedText] = useState("");
  const [seedStats, setSeedStats] = useState<{ count: number } | null>(null);
  const [seedExpanded, setSeedExpanded] = useState(false);

  // Step 2 — Scenarios
  const [priceChange, setPriceChange] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [inventoryBudget, setInventoryBudget] = useState(0);
  const [marketGrowth, setMarketGrowth] = useState(0);

  // Step 3 — Launch
  const [title, setTitle] = useState("Business Cashflow Simulation");
  const [forecastMonths, setForecastMonths] = useState(3);

  const { data: simulations, isLoading: simsLoading } = trpc.simulations.list.useQuery();

  const seedMutation = trpc.simulations.generateSeed.useMutation({
    onSuccess: (data) => {
      setSeedText(data.seedText);
      setSeedStats({ count: data.transactionCount });
      toast.success(`Seed generated from ${data.transactionCount} transactions`);
    },
    onError: (e) => toast.error(e.message),
  });

  const runMutation = trpc.simulations.run.useMutation({
    onSuccess: (data) => {
      utils.simulations.list.invalidate();
      toast.success("Simulation selesai!");
      setLocation(`/simulation/${data.simulationId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRun = () => {
    if (!seedText.trim()) { toast.error("Generate seed text first"); return; }
    runMutation.mutate({
      title,
      seedText,
      forecastMonths,
      scenarioParams: { priceChange, employeeCount, inventoryBudget, marketGrowth },
    });
  };

  const hasScenario = priceChange !== 0 || employeeCount > 0 || inventoryBudget > 0 || marketGrowth !== 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl">

      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Swarm Simulation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Multi-agent cashflow prediction powered by FiSwarm swarm intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Wizard ─────────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Step progress bar */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    onClick={() => { if (s.id === 1 || (s.id === 2 && seedText) || (s.id === 3 && seedText)) setStep(s.id as 1|2|3); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all w-full ${
                      active
                        ? "bg-primary/10 border-primary text-primary"
                        : done
                        ? "bg-[oklch(0.18_0.02_145)]/40 border-[oklch(0.30_0.06_145)] text-[oklch(0.65_0.12_145)]"
                        : "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                    }`}
                    disabled={s.id === 2 && !seedText || s.id === 3 && !seedText}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold ${
                      active ? "bg-primary text-primary-foreground" : done ? "bg-[oklch(0.30_0.06_145)] text-[oklch(0.65_0.12_145)]" : "bg-accent"
                    }`}>
                      {done ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-semibold leading-none">{s.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 truncate">{s.desc}</div>
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className={`h-4 w-4 mx-1 shrink-0 ${step > s.id ? "text-[oklch(0.65_0.12_145)]" : "text-border"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: Seed Generator ──────────────────────────────────────── */}
          {step === 1 && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Auto Seed Generator</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Extracts financial patterns from your transaction history and converts them into structured seed text for the AI agents.
                  </p>
                </div>

                {/* Month selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Data range to include</Label>
                    <span className="text-sm font-semibold text-primary">{seedMonths} months</span>
                  </div>
                  <div className="flex gap-2">
                    {[3, 6, 9, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSeedMonths(m)}
                        className={`flex-1 py-2 text-xs rounded border font-medium transition-all ${
                          seedMonths === m
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {m} mo
                      </button>
                    ))}
                  </div>
                  <Slider
                    value={[seedMonths]}
                    onValueChange={([v]) => setSeedMonths(v)}
                    min={1} max={12} step={1}
                    className="mt-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>1 month</span><span>12 months</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => seedMutation.mutate({ months: seedMonths })}
                  disabled={seedMutation.isPending}
                >
                  {seedMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating seed...</>
                  ) : (
                    <><RefreshCw className="h-4 w-4 mr-2" /> Generate Seed from {seedMonths} Months</>
                  )}
                </Button>

                {/* Seed result */}
                {seedText && (
                  <div className="rounded-lg border border-[oklch(0.30_0.06_145)] bg-[oklch(0.18_0.02_145)]/30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.30_0.06_145)]/50">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[oklch(0.65_0.12_145)]" />
                        <span className="text-xs font-semibold text-[oklch(0.65_0.12_145)]">Seed Generated</span>
                        {seedStats && (
                          <span className="text-xs text-muted-foreground">— {seedStats.count} transactions</span>
                        )}
                      </div>
                      <button
                        onClick={() => setSeedExpanded(!seedExpanded)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        {seedExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</> : <><ChevronDown className="h-3.5 w-3.5" /> Preview</>}
                      </button>
                    </div>
                    {seedExpanded && (
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed p-4 max-h-52 overflow-y-auto">
                        {seedText}
                      </pre>
                    )}
                  </div>
                )}

                {/* Next step CTA */}
                {seedText && (
                  <Button className="w-full" variant="outline" onClick={() => setStep(2)}>
                    Continue to Scenarios <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── STEP 2: What-if Scenarios ───────────────────────────────────── */}
          {step === 2 && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">What-if Scenario Parameters</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inject business variables to simulate different future scenarios. Leave at default for a baseline forecast.
                  </p>
                </div>

                {/* Price Change */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label className="text-sm font-medium">Price Change</Label>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${
                      priceChange > 0 ? "text-[oklch(0.65_0.12_145)]" : priceChange < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {priceChange > 0 ? "+" : ""}{priceChange}%
                    </span>
                  </div>
                  <Slider value={[priceChange]} onValueChange={([v]) => setPriceChange(v)} min={-30} max={50} step={5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="text-destructive/70">−30% (price cut)</span>
                    <span className="text-muted-foreground">Baseline (0%)</span>
                    <span className="text-[oklch(0.65_0.12_145)]/70">+50% (increase)</span>
                  </div>
                </div>

                {/* Employee Count */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label className="text-sm font-medium">New Employees to Hire</Label>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {employeeCount} {employeeCount === 1 ? "person" : "people"}
                      </span>
                      {employeeCount > 0 && (
                        <div className="text-[10px] text-destructive/80">
                          +{formatUSD(employeeCount * 3_500_000)}/bulan
                        </div>
                      )}
                    </div>
                  </div>
                  <Slider value={[employeeCount]} onValueChange={([v]) => setEmployeeCount(v)} min={0} max={10} step={1} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>No new hires</span><span>10 new employees</span>
                  </div>
                </div>

                {/* Inventory Budget */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label className="text-sm font-medium">Additional Inventory / Month</Label>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{formatUSD(inventoryBudget)}</span>
                  </div>
                  <Slider value={[inventoryBudget]} onValueChange={([v]) => setInventoryBudget(v)} min={0} max={20_000_000} step={500_000} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>$0</span><span>$20M</span>
                  </div>
                </div>

                {/* Market Growth */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <Label className="text-sm font-medium">Market Growth Assumption</Label>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${
                      marketGrowth > 0 ? "text-[oklch(0.65_0.12_145)]" : marketGrowth < 0 ? "text-destructive" : "text-muted-foreground"
                    }`}>
                      {marketGrowth > 0 ? "+" : ""}{marketGrowth}%
                    </span>
                  </div>
                  <Slider value={[marketGrowth]} onValueChange={([v]) => setMarketGrowth(v)} min={-20} max={30} step={5} />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="text-destructive/70">−20% (contraction)</span>
                    <span className="text-[oklch(0.65_0.12_145)]/70">+30% (growth)</span>
                  </div>
                </div>

                {/* Scenario summary chips */}
                {hasScenario && (
                  <div className="rounded-lg border border-border bg-accent/20 px-4 py-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Active Scenario Changes</div>
                    <div className="flex flex-wrap gap-2">
                      {priceChange !== 0 && (
                        <span className={`text-xs px-2 py-1 rounded border ${priceChange > 0 ? "border-[oklch(0.30_0.06_145)] text-[oklch(0.65_0.12_145)] bg-[oklch(0.18_0.02_145)]/40" : "border-[oklch(0.30_0.08_25)] text-[oklch(0.60_0.18_25)] bg-[oklch(0.18_0.02_25)]/40"}`}>
                          Price {priceChange > 0 ? "+" : ""}{priceChange}%
                        </span>
                      )}
                      {employeeCount > 0 && (
                        <span className="text-xs px-2 py-1 rounded border border-border text-muted-foreground bg-accent/30">
                          +{employeeCount} employees
                        </span>
                      )}
                      {inventoryBudget > 0 && (
                        <span className="text-xs px-2 py-1 rounded border border-border text-muted-foreground bg-accent/30">
                          Inventory +{formatUSD(inventoryBudget)}/mo
                        </span>
                      )}
                      {marketGrowth !== 0 && (
                        <span className={`text-xs px-2 py-1 rounded border ${marketGrowth > 0 ? "border-[oklch(0.30_0.06_145)] text-[oklch(0.65_0.12_145)] bg-[oklch(0.18_0.02_145)]/40" : "border-[oklch(0.30_0.08_25)] text-[oklch(0.60_0.18_25)] bg-[oklch(0.18_0.02_25)]/40"}`}>
                          Market {marketGrowth > 0 ? "+" : ""}{marketGrowth}%
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    Continue to Launch <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── STEP 3: Launch ──────────────────────────────────────────────── */}
          {step === 3 && (
            <Card className="bg-card border-border">
              <CardContent className="p-5 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Launch Simulation</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure the simulation parameters, then launch the 4-agent swarm.
                  </p>
                </div>

                {/* Title + Forecast period */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Simulation Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9 text-sm"
                      placeholder="e.g. Q2 2026 Forecast"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Forecast Period</Label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 6].map((m) => (
                        <button
                          key={m}
                          onClick={() => setForecastMonths(m)}
                          className={`flex-1 h-9 text-sm rounded border font-medium transition-all ${
                            forecastMonths === m
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {m}mo
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Agent cards */}
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Active Agents</div>
                  <div className="grid grid-cols-2 gap-2">
                    {AGENTS.map((a) => (
                      <div
                        key={a.key}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-accent/10"
                      >
                        <div
                          className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold mt-0.5"
                          style={{ background: a.bg, color: a.color }}
                        >
                          {a.label[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{a.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Config summary */}
                <div className="rounded-lg border border-border bg-accent/10 px-4 py-3 space-y-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Simulation Summary</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seed data</span>
                      <span className="text-foreground font-medium">{seedStats?.count ?? "—"} transactions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forecast</span>
                      <span className="text-foreground font-medium">{forecastMonths} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agents</span>
                      <span className="text-foreground font-medium">4 active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scenario</span>
                      <span className={hasScenario ? "text-[oklch(0.70_0.12_55)] font-medium" : "text-muted-foreground"}>
                        {hasScenario ? "Custom" : "Baseline"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleRun}
                    disabled={runMutation.isPending || !seedText}
                  >
                    {runMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running agents...</>
                    ) : (
                      <><Rocket className="h-4 w-4 mr-2" /> Run Swarm Simulation</>
                    )}
                  </Button>
                </div>

                {runMutation.isPending && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="text-xs font-medium text-primary mb-2">Agents are working...</div>
                    <div className="space-y-1.5">
                      {AGENTS.map((a, i) => (
                        <div key={a.key} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: a.color, animationDelay: `${i * 200}ms` }} />
                          <span className="text-xs text-muted-foreground">{a.label} agent analyzing...</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Simulation History ─────────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Simulation History</div>
            {simsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : !simulations || simulations.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">No simulations yet.</div>
                <div className="text-[10px] text-muted-foreground mt-1">Run your first simulation above.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {simulations.map((sim) => {
                  const sc = statusConfig[sim.status];
                  const StatusIcon = sc.icon;
                  return (
                    <button
                      key={sim.id}
                      onClick={() => setLocation(`/simulation/${sim.id}`)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-accent/20 transition-all text-left group"
                    >
                      <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${sc.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                          {sim.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-muted-foreground">{sim.forecastMonths}mo</span>
                          {sim.riskLevel && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${riskBadge[sim.riskLevel] ?? ""}`}>
                              {sim.riskLevel.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick tips */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">How It Works</div>
            <div className="space-y-2.5">
              {[
                { step: "1", text: "Generate seed from your transaction history" },
                { step: "2", text: "Set what-if variables to model scenarios" },
                { step: "3", text: "4 AI agents simulate your business world" },
                { step: "4", text: "Get cashflow forecast + risk alerts" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded bg-accent text-[10px] font-bold text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
