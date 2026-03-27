import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";
import { BrainCircuit, RefreshCw, ChevronRight, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

function formatIDR(n: number) {
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}K`;
  return `Rp ${n.toFixed(0)}`;
}

const statusIcon = {
  pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  running: <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />,
  completed: <CheckCircle className="h-3.5 w-3.5 text-[oklch(0.65_0.12_145)]" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

export default function Simulation() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Seed generation
  const [seedMonths, setSeedMonths] = useState(6);
  const [seedText, setSeedText] = useState("");
  const [title, setTitle] = useState("Business Cashflow Simulation");
  const [forecastMonths, setForecastMonths] = useState(3);

  // What-if scenario sliders
  const [priceChange, setPriceChange] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [inventoryBudget, setInventoryBudget] = useState(0);
  const [marketGrowth, setMarketGrowth] = useState(0);

  const { data: simulations, isLoading: simsLoading } = trpc.simulations.list.useQuery();

  const seedMutation = trpc.simulations.generateSeed.useMutation({
    onSuccess: (data) => {
      setSeedText(data.seedText);
      toast.success(`Seed generated from ${data.transactionCount} transactions`);
    },
    onError: (e) => toast.error(e.message),
  });

  const runMutation = trpc.simulations.run.useMutation({
    onSuccess: (data) => {
      utils.simulations.list.invalidate();
      toast.success("Simulation completed");
      setLocation(`/simulation/${data.simulationId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRun = () => {
    if (!seedText.trim()) {
      toast.error("Generate seed text first");
      return;
    }
    runMutation.mutate({
      title,
      seedText,
      forecastMonths,
      scenarioParams: { priceChange, employeeCount, inventoryBudget, marketGrowth },
    });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Swarm Simulation</h1>
        <p className="text-sm text-muted-foreground">
          Multi-agent cashflow prediction using MiroFish-inspired swarm intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Config panel */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1: Seed Generator */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">01</span>
                <CardTitle className="text-sm font-medium">Auto Seed Generator</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Convert your transaction history into AI seed text for simulation
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Months of data to include</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[seedMonths]}
                      onValueChange={([v]) => setSeedMonths(v)}
                      min={1} max={12} step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-num w-16 text-right">{seedMonths} months</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seedMutation.mutate({ months: seedMonths })}
                  disabled={seedMutation.isPending}
                  className="shrink-0"
                >
                  {seedMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Generate Seed
                </Button>
              </div>

              {seedText && (
                <div className="rounded border border-border bg-background p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Generated Seed Text</div>
                  <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {seedText}
                  </pre>
                </div>
              )}

              {!seedText && (
                <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Click "Generate Seed" to extract financial patterns from your transaction history
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: What-if Scenarios */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">02</span>
                <CardTitle className="text-sm font-medium">What-if Scenario Parameters</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Inject variables to simulate different business scenarios
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-5">
              {/* Price Change */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Price Change</Label>
                  <span className={`text-xs font-num font-medium ${priceChange > 0 ? "text-[oklch(0.65_0.12_145)]" : priceChange < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {priceChange > 0 ? "+" : ""}{priceChange}%
                  </span>
                </div>
                <Slider value={[priceChange]} onValueChange={([v]) => setPriceChange(v)} min={-30} max={50} step={5} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>−30% (price cut)</span><span>+50% (price increase)</span>
                </div>
              </div>

              {/* Employee Count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">New Employees to Hire</Label>
                  <span className="text-xs font-num font-medium text-foreground">
                    {employeeCount} {employeeCount === 1 ? "person" : "people"}
                    {employeeCount > 0 && <span className="text-muted-foreground ml-1">(+{formatIDR(employeeCount * 3500000)}/mo)</span>}
                  </span>
                </div>
                <Slider value={[employeeCount]} onValueChange={([v]) => setEmployeeCount(v)} min={0} max={10} step={1} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>No new hires</span><span>10 new employees</span>
                </div>
              </div>

              {/* Inventory Budget */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Additional Inventory Budget / Month</Label>
                  <span className="text-xs font-num font-medium text-foreground">{formatIDR(inventoryBudget)}</span>
                </div>
                <Slider value={[inventoryBudget]} onValueChange={([v]) => setInventoryBudget(v)} min={0} max={20000000} step={500000} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Rp 0</span><span>Rp 20M</span>
                </div>
              </div>

              {/* Market Growth */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Market Growth Assumption</Label>
                  <span className={`text-xs font-num font-medium ${marketGrowth > 0 ? "text-[oklch(0.65_0.12_145)]" : marketGrowth < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {marketGrowth > 0 ? "+" : ""}{marketGrowth}%
                  </span>
                </div>
                <Slider value={[marketGrowth]} onValueChange={([v]) => setMarketGrowth(v)} min={-20} max={30} step={5} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>−20% (contraction)</span><span>+30% (growth)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Launch */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">03</span>
                <CardTitle className="text-sm font-medium">Launch Simulation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-4">
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
                  <div className="flex gap-1">
                    {[1, 2, 3, 6].map((m) => (
                      <button
                        key={m}
                        onClick={() => setForecastMonths(m)}
                        className={`flex-1 h-9 text-sm rounded border transition-colors ${
                          forecastMonths === m
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        {m}mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent summary */}
              <div className="border border-border rounded p-3 space-y-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Active Agents</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Owner", color: "agent-owner" },
                    { label: "Supplier", color: "agent-supplier" },
                    { label: "Customer", color: "agent-customer" },
                    { label: "Bank", color: "agent-bank" },
                  ].map((a) => (
                    <div key={a.label} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                      <span className={`text-xs font-medium ${a.color}`}>{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleRun}
                disabled={runMutation.isPending || !seedText}
              >
                {runMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    Run Swarm Simulation
                  </>
                )}
              </Button>
              {!seedText && (
                <p className="text-xs text-muted-foreground text-center">Generate seed text first to enable simulation</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Simulation history */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Simulation History
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {simsLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
              ) : !simulations || simulations.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No simulations yet.<br />Run your first simulation above.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {simulations.map((sim) => (
                    <button
                      key={sim.id}
                      onClick={() => setLocation(`/simulation/${sim.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-accent/30 transition-colors text-left"
                    >
                      {statusIcon[sim.status]}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{sim.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {sim.forecastMonths}mo forecast
                          {sim.riskLevel && (
                            <span className={`ml-2 risk-${sim.riskLevel}`}>
                              {sim.riskLevel.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
