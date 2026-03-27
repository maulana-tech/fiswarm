import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowRight, BrainCircuit, BarChart3, ShieldAlert, MessageSquare, Zap } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Accounting Dashboard",
    desc: "Record income, expenses, and invoices. View KPI cards and monthly trend charts in real time.",
  },
  {
    icon: BrainCircuit,
    title: "Swarm AI Simulation",
    desc: "Multi-agent simulation with Owner, Supplier, Customer, and Bank agents to forecast 1–3 month cashflow.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Alert System",
    desc: "Automatic detection of cashflow risks. Color-coded severity levels with actionable recommendations.",
  },
  {
    icon: MessageSquare,
    title: "Chat with Agent",
    desc: "Interact directly with simulated agents. Ask what-if questions and get realistic business responses.",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-primary tracking-tight">AkunFish</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:block">
            UMKM Financial Intelligence
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => setLocation("/demo")} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs">
            <Zap className="h-3.5 w-3.5" /> Demo
          </Button>
          {isAuthenticated ? (
            <Button size="sm" onClick={() => setLocation("/dashboard")}>
              Open Dashboard
            </Button>
          ) : (
            <Button size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-3xl mx-auto">
        <div className="text-xs text-muted-foreground uppercase tracking-widest border border-border px-3 py-1 rounded mb-8">
          LovHacks Season 2 — Swarm AI for UMKM
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
          Predict Your Business<br />
          <span className="text-primary">Cashflow with Swarm AI</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mb-10 leading-relaxed">
          AkunFish combines accounting management with MiroFish-inspired swarm simulation.
          Record transactions, run multi-agent predictions, and get actionable financial reports in Indonesian.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {isAuthenticated ? (
            <Button size="lg" onClick={() => setLocation("/dashboard")} className="gap-2">
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="lg" onClick={() => { window.location.href = getLoginUrl(); }} className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={() => setLocation("/simulation")}>
            View Simulation
          </Button>
          <Button size="lg" variant="outline" onClick={() => setLocation("/demo")} className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
            <Zap className="h-4 w-4" /> Quick Demo
          </Button>
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t border-border px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-10">
            Platform Capabilities
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
            {features.map((f) => (
              <div key={f.title} className="bg-background p-6">
                <f.icon className="h-5 w-5 text-primary mb-3" />
                <div className="font-semibold text-sm mb-2">{f.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-t border-border px-6 py-16 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-10">
            How It Works
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
            {[
              { step: "01", title: "Record Transactions", desc: "Input daily income, expenses, and invoices" },
              { step: "02", title: "Generate Seed", desc: "Auto-convert 3–6 months of data into AI seed text" },
              { step: "03", title: "Configure Scenario", desc: "Set what-if parameters: price, staff, inventory" },
              { step: "04", title: "Run Simulation", desc: "4 agents analyze your business from every angle" },
              { step: "05", title: "Get Report", desc: "Receive cashflow forecast and Indonesian report" },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col gap-2">
                <div className="text-xs font-mono text-muted-foreground">{s.step}</div>
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
                {i < 4 && (
                  <div className="hidden sm:block mt-2 text-muted-foreground/30 text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <span>AkunFish — Built for LovHacks Season 2</span>
        <span>Powered by MiroFish Swarm Intelligence</span>
      </footer>
    </div>
  );
}
