import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BrainCircuit,
  BarChart3,
  ShieldAlert,
  MessageSquare,
  Zap,
  FileText,
  Upload,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";

// ── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "4", label: "AI Agents" },
  { value: "9", label: "Slide Pitch Deck" },
  { value: "3", label: "Bulan Proyeksi" },
  { value: "100%", label: "Bahasa Indonesia" },
];

const features = [
  {
    icon: BarChart3,
    title: "Accounting Dashboard",
    desc: "Catat pemasukan, pengeluaran, dan invoice harian. KPI cards dan grafik tren bulanan secara real-time.",
    tag: "Core",
  },
  {
    icon: BrainCircuit,
    title: "Swarm AI Simulation",
    desc: "Simulasi multi-agen dengan Owner, Supplier, Customer, dan Bank untuk proyeksi cashflow 1–3 bulan.",
    tag: "AI",
  },
  {
    icon: ShieldAlert,
    title: "Risk Alert System",
    desc: "Deteksi otomatis risiko cashflow dengan 4 tingkat keparahan dan rekomendasi tindakan yang jelas.",
    tag: "Alert",
  },
  {
    icon: MessageSquare,
    title: "Chat with Agent",
    desc: "Berinteraksi langsung dengan agen simulasi. Tanyakan skenario what-if dan dapatkan respons bisnis realistis.",
    tag: "Chat",
  },
  {
    icon: FileText,
    title: "Laporan Bahasa Indonesia",
    desc: "Generator laporan keuangan komprehensif dalam Bahasa Indonesia, lengkap dengan export pitch deck PDF.",
    tag: "Report",
  },
  {
    icon: Upload,
    title: "Import CSV / Excel",
    desc: "Upload data transaksi dari file CSV, Excel, atau JSON. Auto-detect kolom dengan mapper visual.",
    tag: "Import",
  },
];

const steps = [
  {
    num: "01",
    icon: Upload,
    title: "Input Transaksi",
    desc: "Catat manual atau import CSV/Excel dari data keuangan bisnis Anda.",
  },
  {
    num: "02",
    icon: Zap,
    title: "Generate Seed",
    desc: "Sistem otomatis mengubah 3–12 bulan data menjadi seed teks untuk AI.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Atur Skenario",
    desc: "Sesuaikan parameter: perubahan harga, jumlah karyawan, anggaran inventori.",
  },
  {
    num: "04",
    icon: BrainCircuit,
    title: "Jalankan Simulasi",
    desc: "4 agen AI menganalisis bisnis dari perspektif Owner, Supplier, Customer, dan Bank.",
  },
  {
    num: "05",
    icon: FileText,
    title: "Terima Laporan",
    desc: "Dapatkan proyeksi cashflow, peringatan risiko, dan laporan lengkap dalam Bahasa Indonesia.",
  },
];

const agents = [
  {
    role: "Owner",
    color: "text-primary border-primary/30 bg-primary/5",
    dot: "bg-primary",
    desc: "Menganalisis keputusan strategis, margin keuntungan, dan arah pertumbuhan bisnis.",
  },
  {
    role: "Supplier",
    color: "text-amber-400 border-amber-400/30 bg-amber-400/5",
    dot: "bg-amber-400",
    desc: "Mengevaluasi rantai pasokan, risiko keterlambatan, dan negosiasi harga bahan baku.",
  },
  {
    role: "Customer",
    color: "text-sky-400 border-sky-400/30 bg-sky-400/5",
    dot: "bg-sky-400",
    desc: "Memproyeksikan pola pembelian, sensitivitas harga, dan loyalitas pelanggan.",
  },
  {
    role: "Bank",
    color: "text-violet-400 border-violet-400/30 bg-violet-400/5",
    dot: "bg-violet-400",
    desc: "Menilai kelayakan kredit, rasio likuiditas, dan risiko gagal bayar.",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [currentPath, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Sticky Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center shrink-0">
              <BrainCircuit className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm tracking-tight">AkunFish</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest hidden sm:block">
                UMKM Financial Intelligence
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            {([
              { path: "/demo", label: "Demo" },
              { path: "/dashboard", label: "Dashboard" },
              { path: "/simulation", label: "Simulasi" },
              { path: "/reports", label: "Laporan" },
            ] as const).map((item) => (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`hover:text-foreground transition-colors ${
                  currentPath === item.path ? "text-foreground font-medium" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/demo")}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs hidden sm:flex"
            >
              <Zap className="h-3.5 w-3.5" />
              Quick Demo
            </Button>
            {isAuthenticated ? (
              <Button size="sm" onClick={() => setLocation("/dashboard")} className="gap-1.5 text-xs">
                Dashboard <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="gap-1.5 text-xs"
              >
                Masuk <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border min-h-[calc(100vh-56px)] flex items-center">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #00e5cc 1px, transparent 1px), linear-gradient(to bottom, #00e5cc 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest border border-primary/20 bg-primary/5 px-3 py-1.5 rounded mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                LovHacks Season 2 — Swarm AI for UMKM
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
                Prediksi Cashflow<br />
                Bisnis Anda dengan<br />
                <span className="text-primary">Swarm AI</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md">
                AkunFish menggabungkan pencatatan akuntansi UMKM dengan simulasi swarm
                berbasis MiroFish. Rekam transaksi, jalankan prediksi multi-agen, dan
                dapatkan laporan keuangan lengkap dalam Bahasa Indonesia.
              </p>
              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Button onClick={() => setLocation("/dashboard")} className="gap-2">
                    Buka Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => { window.location.href = getLoginUrl(); }} className="gap-2">
                    Mulai Sekarang <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setLocation("/demo")}
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Zap className="h-4 w-4" />
                  Lihat Demo
                </Button>
              </div>
            </div>

            {/* Right: terminal-style preview card */}
            <div className="hidden md:block">
              <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xl">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-background">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-3 text-[10px] text-muted-foreground font-mono">
                    akunfish — simulasi swarm
                  </span>
                </div>
                {/* Content */}
                <div className="p-5 font-mono text-xs space-y-3">
                  <div className="text-muted-foreground">
                    <span className="text-primary">$</span> Menginisialisasi agen swarm...
                  </div>
                  {agents.map((a) => (
                    <div key={a.role} className="flex items-start gap-3">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${a.dot}`} />
                      <div>
                        <span className={`font-semibold ${a.color.split(" ")[0]}`}>
                          [{a.role}]
                        </span>{" "}
                        <span className="text-muted-foreground">{a.desc.substring(0, 52)}...</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border text-muted-foreground">
                    <span className="text-primary">→</span> Proyeksi 3 bulan selesai.{" "}
                    <span className="text-primary">Confidence: 78%</span>
                  </div>
                  <div className="flex gap-4 pt-1">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Cashflow Bersih</div>
                      <div className="text-primary font-semibold text-sm">+Rp 21.0jt</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Risiko</div>
                      <div className="text-amber-400 font-semibold text-sm">MEDIUM</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Agen Aktif</div>
                      <div className="text-sky-400 font-semibold text-sm">4 / 4</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-border">
            {stats.map((s) => (
              <div key={s.label} className="pl-6 first:pl-0">
                <div className="text-2xl font-bold text-primary tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="border-b border-border py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="text-[10px] text-primary uppercase tracking-widest mb-3">Fitur Platform</div>
            <h2 className="text-2xl font-bold tracking-tight">
              Semua yang dibutuhkan UMKM
            </h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-lg">
              Dari pencatatan transaksi harian hingga simulasi AI multi-agen — satu platform untuk seluruh kebutuhan keuangan bisnis Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-background p-6 hover:bg-card transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-8 h-8 rounded border border-primary/20 bg-primary/5 flex items-center justify-center">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">
                    {f.tag}
                  </span>
                </div>
                <div className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors">
                  {f.title}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="border-b border-border py-20 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="text-[10px] text-primary uppercase tracking-widest mb-3">Cara Kerja</div>
            <h2 className="text-2xl font-bold tracking-tight">5 langkah dari data ke insight</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[calc(10%+16px)] right-[calc(10%+16px)] h-px bg-border" />

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {steps.map((s, i) => (
                <div key={s.num} className="flex flex-col items-start lg:items-center text-left lg:text-center">
                  <div className="relative mb-4">
                    <div className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center z-10 relative">
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[8px] font-bold text-primary-foreground">{i + 1}</span>
                    </div>
                  </div>
                  <div className="font-semibold text-sm mb-1">{s.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Agents showcase ─────────────────────────────────────────────────── */}
      <section className="border-b border-border py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[10px] text-primary uppercase tracking-widest mb-3">Swarm Intelligence</div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                4 Agen AI bekerja<br />secara bersamaan
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Terinspirasi dari arsitektur MiroFish, setiap agen memiliki perspektif dan
                pengetahuan unik tentang bisnis Anda. Mereka berkolaborasi untuk menghasilkan
                proyeksi cashflow yang lebih akurat dari analisis tunggal.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/demo")}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              >
                Lihat Simulasi Demo <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {agents.map((a) => (
                <div
                  key={a.role}
                  className={`rounded-lg border p-4 ${a.color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${a.dot}`} />
                    <span className="font-semibold text-xs uppercase tracking-wider">
                      {a.role}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-80">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border py-16 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="border border-primary/20 bg-primary/5 rounded-lg px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-1">
                Siap memprediksi cashflow bisnis Anda?
              </h2>
              <p className="text-sm text-muted-foreground">
                Mulai dengan Quick Demo — tidak perlu daftar, langsung lihat semua fitur.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setLocation("/demo")}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Zap className="h-4 w-4" />
                Quick Demo
              </Button>
              {isAuthenticated ? (
                <Button onClick={() => setLocation("/dashboard")} className="gap-2">
                  Buka Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => { window.location.href = getLoginUrl(); }} className="gap-2">
                  Mulai Gratis <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
              <BrainCircuit className="h-3 w-3 text-primary" />
            </div>
            <span>AkunFish — Built for LovHacks Season 2</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setLocation("/demo")} className="hover:text-foreground transition-colors">Demo</button>
            <button onClick={() => setLocation("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
            <button onClick={() => setLocation("/simulation")} className="hover:text-foreground transition-colors">Simulasi</button>
            <button onClick={() => setLocation("/reports")} className="hover:text-foreground transition-colors">Laporan</button>
          </div>
          <span>Powered by MiroFish Swarm Intelligence</span>
        </div>
      </footer>
    </div>
  );
}
