import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, BarChart3, ChevronRight, FileText, MessageSquare, Shield, TrendingUp, Upload, Zap } from "lucide-react";

// ── Mini chart data for hero mockup ──────────────────────────────────────────
const MINI_BARS = [40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100];
const FORECAST_LINE = [60, 65, 70, 68, 75, 80, 85, 82, 90, 95, 92, 100];

// ── Stat items ────────────────────────────────────────────────────────────────
const STATS = [
  { value: "4", label: "AI Agents", sub: "Owner · Supplier · Customer · Bank" },
  { value: "3×", label: "Akurasi Lebih Tinggi", sub: "vs. analisis tunggal" },
  { value: "9", label: "Slide Pitch Deck", sub: "Auto-generated PDF" },
  { value: "100%", label: "Bahasa Indonesia", sub: "Laporan & Rekomendasi" },
];

// ── Feature bento items ───────────────────────────────────────────────────────
const FEATURES = [
  {
    tag: "CORE",
    title: "Accounting Dashboard",
    desc: "KPI cards real-time, grafik tren bulanan, dan pencatatan transaksi harian dalam satu tampilan.",
    icon: BarChart3,
    size: "large",
    preview: "kpi",
  },
  {
    tag: "AI",
    title: "Swarm AI Simulation",
    desc: "4 agen LLM berkolaborasi untuk proyeksi cashflow 1–3 bulan.",
    icon: Zap,
    size: "small",
    preview: "agents",
  },
  {
    tag: "ALERT",
    title: "Risk Alert System",
    desc: "Deteksi otomatis 4 level risiko cashflow.",
    icon: Shield,
    size: "small",
    preview: "risk",
  },
  {
    tag: "REPORT",
    title: "Laporan & Pitch Deck",
    desc: "Laporan keuangan Bahasa Indonesia + export 9-slide PDF.",
    icon: FileText,
    size: "small",
    preview: "report",
  },
  {
    tag: "CHAT",
    title: "Chat with Agent",
    desc: "Tanya langsung ke agen simulasi tentang kondisi bisnis Anda.",
    icon: MessageSquare,
    size: "small",
    preview: "chat",
  },
  {
    tag: "IMPORT",
    title: "Import CSV / Excel",
    desc: "Upload data keuangan dari file CSV, Excel, atau JSON dengan auto-detect kolom.",
    icon: Upload,
    size: "large",
    preview: "import",
  },
];

// ── Agent definitions ─────────────────────────────────────────────────────────
const AGENTS = [
  { name: "Owner", color: "#00d4aa", border: "border-[#00d4aa]/30", bg: "bg-[#00d4aa]/5", desc: "Keputusan strategis, margin keuntungan, dan arah pertumbuhan bisnis." },
  { name: "Supplier", color: "#f59e0b", border: "border-amber-500/30", bg: "bg-amber-500/5", desc: "Rantai pasokan, risiko keterlambatan, dan negosiasi harga bahan baku." },
  { name: "Customer", color: "#818cf8", border: "border-indigo-400/30", bg: "bg-indigo-400/5", desc: "Pola pembelian, sensitivitas harga, dan proyeksi loyalitas pelanggan." },
  { name: "Bank", color: "#34d399", border: "border-emerald-400/30", bg: "bg-emerald-400/5", desc: "Kelayakan kredit, rasio likuiditas, dan penilaian risiko gagal bayar." },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { n: "01", title: "Input Transaksi", desc: "Catat manual atau import CSV/Excel" },
  { n: "02", title: "Generate Seed", desc: "Data dikonversi ke seed AI otomatis" },
  { n: "03", title: "Atur Skenario", desc: "Sesuaikan parameter what-if" },
  { n: "04", title: "Jalankan Simulasi", desc: "4 agen AI bekerja bersamaan" },
  { n: "05", title: "Terima Laporan", desc: "Proyeksi + pitch deck siap pakai" },
];

// ── KPI Preview Component ─────────────────────────────────────────────────────
function KpiPreview() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f0d] overflow-hidden text-[10px] font-mono shadow-2xl">
      {/* Window bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10 bg-white/[0.03]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-white/30 text-[9px]">akunfish — dashboard</span>
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-px bg-white/5 border-b border-white/10">
        {[
          { label: "TOTAL PENDAPATAN", val: "Rp 48.2jt", up: true },
          { label: "PENGELUARAN", val: "Rp 31.5jt", up: false },
          { label: "NET CASHFLOW", val: "Rp 16.7jt", up: true },
        ].map((k) => (
          <div key={k.label} className="px-3 py-2.5 bg-[#0a0f0d]">
            <div className="text-white/30 text-[8px] tracking-widest mb-1">{k.label}</div>
            <div className={`text-sm font-bold ${k.up ? "text-[#00d4aa]" : "text-red-400"}`}>{k.val}</div>
            <div className={`text-[8px] mt-0.5 ${k.up ? "text-[#00d4aa]/60" : "text-red-400/60"}`}>{k.up ? "▲ 12.4%" : "▼ 3.1%"} vs bulan lalu</div>
          </div>
        ))}
      </div>
      {/* Mini bar chart */}
      <div className="px-3 py-3">
        <div className="text-white/30 text-[8px] tracking-widest mb-2">TREN 12 BULAN</div>
        <div className="flex items-end gap-0.5 h-12">
          {MINI_BARS.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: i === MINI_BARS.length - 1 ? "#00d4aa" : `rgba(0,212,170,${0.2 + (i / MINI_BARS.length) * 0.4})`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-white/20 text-[7px] mt-1">
          <span>Apr</span><span>Jun</span><span>Agu</span><span>Okt</span><span>Des</span><span>Mar</span>
        </div>
      </div>
      {/* Forecast line */}
      <div className="px-3 pb-3 border-t border-white/5">
        <div className="text-white/30 text-[8px] tracking-widest mt-2 mb-2">PROYEKSI 3 BULAN — CONFIDENCE 78%</div>
        <svg viewBox="0 0 120 32" className="w-full h-8" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00d4aa" stopOpacity="1" />
            </linearGradient>
          </defs>
          <polyline
            points={FORECAST_LINE.map((v, i) => `${(i / (FORECAST_LINE.length - 1)) * 120},${32 - (v / 100) * 28}`).join(" ")}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dashed forecast portion */}
          <polyline
            points={FORECAST_LINE.slice(8).map((v, i) => `${((i + 8) / (FORECAST_LINE.length - 1)) * 120},${32 - (v / 100) * 28}`).join(" ")}
            fill="none"
            stroke="#00d4aa"
            strokeWidth="1.5"
            strokeDasharray="3,2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#00d4aa] text-[8px]">▲ CASHFLOW POSITIF</span>
          <span className="text-white/20 text-[8px]">RISIKO: MEDIUM</span>
          <span className="text-white/20 text-[8px]">AGEN: 4/4</span>
        </div>
      </div>
    </div>
  );
}

// ── Feature Card Preview ──────────────────────────────────────────────────────
function FeaturePreview({ type }: { type: string }) {
  if (type === "kpi") {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Rp 48.2jt", "Rp 31.5jt", "Rp 16.7jt"].map((v, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2">
            <div className="text-[9px] text-white/30 mb-1">{["PENDAPATAN", "PENGELUARAN", "NET"][i]}</div>
            <div className={`text-xs font-bold ${i === 1 ? "text-red-400" : "text-[#00d4aa]"}`}>{v}</div>
          </div>
        ))}
      </div>
    );
  }
  if (type === "agents") {
    return (
      <div className="mt-3 space-y-1.5">
        {["Owner", "Supplier", "Customer", "Bank"].map((a, i) => (
          <div key={a} className="flex items-center gap-2 text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ["#00d4aa","#f59e0b","#818cf8","#34d399"][i] }} />
            <span className="text-white/50">[{a}]</span>
            <span className="text-white/30 truncate">Menganalisis data bisnis...</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "risk") {
    return (
      <div className="mt-3 space-y-1.5">
        {[
          { label: "Cashflow negatif bulan 2", sev: "HIGH", color: "text-red-400" },
          { label: "Stok menipis", sev: "MED", color: "text-amber-400" },
          { label: "Piutang tertunda", sev: "LOW", color: "text-yellow-400" },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2 text-[9px]">
            <span className={`font-mono font-bold ${r.color}`}>{r.sev}</span>
            <span className="text-white/40">{r.label}</span>
          </div>
        ))}
      </div>
    );
  }
  if (type === "report") {
    return (
      <div className="mt-3 space-y-1.5">
        <div className="text-[9px] text-white/30 font-mono">LAPORAN_KEUANGAN_Q1.pdf</div>
        <div className="flex gap-1 flex-wrap">
          {["Ringkasan", "KPI", "Proyeksi", "Risiko", "Rekomendasi"].map((s) => (
            <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-[#00d4aa]/10 text-[#00d4aa]/80 border border-[#00d4aa]/20">{s}</span>
          ))}
        </div>
      </div>
    );
  }
  if (type === "chat") {
    return (
      <div className="mt-3 space-y-1.5">
        <div className="flex gap-1.5 text-[9px]">
          <span className="text-[#00d4aa]/60 font-mono">Owner:</span>
          <span className="text-white/40">Bagaimana proyeksi bulan depan?</span>
        </div>
        <div className="flex gap-1.5 text-[9px]">
          <span className="text-amber-400/60 font-mono">AI:</span>
          <span className="text-white/40">Cashflow positif +Rp 4.2jt...</span>
        </div>
      </div>
    );
  }
  if (type === "import") {
    return (
      <div className="mt-3 border border-dashed border-white/20 rounded-lg p-3 text-center">
        <div className="text-[9px] text-white/30">CSV · XLSX · JSON</div>
        <div className="text-[8px] text-white/20 mt-1">Auto-detect kolom · Preview sebelum import</div>
      </div>
    );
  }
  return null;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [currentPath, setLocation] = useLocation();

  const NAV_LINKS = [
    { path: "/demo", label: "Demo" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/simulation", label: "Simulasi" },
    { path: "/reports", label: "Laporan" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#060a08] text-white overflow-x-hidden">

      {/* ── Sticky Nav ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 flex items-center px-6 md:px-10"
        style={{ backdropFilter: "blur(16px)", background: "rgba(6,10,8,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Brand */}
        <button onClick={() => setLocation("/")} className="flex items-center gap-2.5 mr-10">
          <div className="w-7 h-7 rounded-md bg-[#00d4aa] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#060a08]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm tracking-tight">AkunFish</span>
          <span className="hidden sm:block text-[10px] text-white/30 font-mono tracking-widest uppercase ml-1">UMKM Financial Intelligence</span>
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                currentPath === item.path
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLocation("/demo")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            <Zap className="w-3 h-3" />
            Quick Demo
          </button>
          <button
            onClick={() => isAuthenticated ? setLocation("/dashboard") : window.location.assign(getLoginUrl())}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-[#00d4aa] text-[#060a08] hover:bg-[#00bfa0] transition-colors"
          >
            Dashboard
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-14">
        {/* Radial glow background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse, #00d4aa 0%, transparent 70%)", filter: "blur(80px)" }}
          />
          <div
            className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #34d399 0%, transparent 70%)", filter: "blur(60px)" }}
          />
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/5 text-[#00d4aa] text-xs font-mono mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
                LOVHACKS SEASON 2 — SWARM AI FOR UMKM
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight mb-6">
                Prediksi<br />
                Cashflow Bisnis<br />
                <span className="text-[#00d4aa]">dengan Swarm AI</span>
              </h1>

              {/* Sub */}
              <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-md">
                AkunFish menggabungkan akuntansi UMKM dengan simulasi multi-agen berbasis MiroFish.
                Rekam transaksi, jalankan prediksi 4 agen AI, dan terima laporan keuangan lengkap dalam Bahasa Indonesia.
              </p>

              {/* CTA row */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => isAuthenticated ? setLocation("/dashboard") : window.location.assign(getLoginUrl())}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00d4aa] text-[#060a08] font-semibold text-sm hover:bg-[#00bfa0] transition-all hover:shadow-[0_0_24px_rgba(0,212,170,0.3)]"
                >
                  Buka Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLocation("/demo")}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 text-white/70 text-sm hover:border-white/30 hover:text-white transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Lihat Demo
                </button>
              </div>

              {/* Trust line */}
              <p className="mt-8 text-white/25 text-xs font-mono">
                DIBANGUN UNTUK LOVHACKS SEASON 2 · SWARM INTELLIGENCE · OPEN SOURCE
              </p>
            </div>

            {/* Right: dashboard mockup */}
            <div className="relative">
              {/* Glow behind card */}
              <div
                className="absolute inset-0 rounded-2xl opacity-30"
                style={{ background: "radial-gradient(ellipse at center, #00d4aa 0%, transparent 70%)", filter: "blur(40px)", transform: "scale(0.9)" }}
              />
              <KpiPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-[#00d4aa] mb-1">{s.value}</div>
              <div className="text-sm font-medium text-white/70">{s.label}</div>
              <div className="text-[11px] text-white/30 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bento Feature Grid ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 py-24">
        {/* Section label */}
        <div className="mb-12">
          <div className="text-[11px] font-mono text-[#00d4aa]/60 tracking-widest mb-3">FITUR PLATFORM</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Semua yang dibutuhkan UMKM,<br />
            <span className="text-white/40">dalam satu platform.</span>
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1: large + small + small */}
          {/* Card 1 — large */}
          <div className="md:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-[#00d4aa]/20 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[9px] font-mono text-[#00d4aa]/60 tracking-widest">{FEATURES[0].tag}</span>
                <h3 className="text-base font-semibold mt-1">{FEATURES[0].title}</h3>
                <p className="text-sm text-white/40 mt-1 max-w-xs">{FEATURES[0].desc}</p>
              </div>
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-[#00d4aa]" />
              </div>
            </div>
            <FeaturePreview type="kpi" />
          </div>

          {/* Card 2 — small */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-[#00d4aa]/20 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[9px] font-mono text-[#00d4aa]/60 tracking-widest">{FEATURES[1].tag}</span>
                <h3 className="text-base font-semibold mt-1">{FEATURES[1].title}</h3>
                <p className="text-sm text-white/40 mt-1">{FEATURES[1].desc}</p>
              </div>
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-[#00d4aa]" />
              </div>
            </div>
            <FeaturePreview type="agents" />
          </div>

          {/* Row 2: small + small + large */}
          {/* Card 3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-[#00d4aa]/20 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[9px] font-mono text-[#00d4aa]/60 tracking-widest">{FEATURES[2].tag}</span>
                <h3 className="text-base font-semibold mt-1">{FEATURES[2].title}</h3>
                <p className="text-sm text-white/40 mt-1">{FEATURES[2].desc}</p>
              </div>
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-[#00d4aa]" />
              </div>
            </div>
            <FeaturePreview type="risk" />
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-[#00d4aa]/20 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[9px] font-mono text-[#00d4aa]/60 tracking-widest">{FEATURES[3].tag}</span>
                <h3 className="text-base font-semibold mt-1">{FEATURES[3].title}</h3>
                <p className="text-sm text-white/40 mt-1">{FEATURES[3].desc}</p>
              </div>
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-[#00d4aa]" />
              </div>
            </div>
            <FeaturePreview type="report" />
          </div>

          {/* Card 5 — large */}
          <div className="md:col-span-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-[#00d4aa]/20 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[9px] font-mono text-[#00d4aa]/60 tracking-widest">{FEATURES[4].tag}</span>
                <h3 className="text-base font-semibold mt-1">{FEATURES[4].title}</h3>
                <p className="text-sm text-white/40 mt-1">{FEATURES[4].desc}</p>
              </div>
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-[#00d4aa]" />
              </div>
            </div>
            <FeaturePreview type="chat" />
          </div>

          {/* Card 6 — full width */}
          <div className="md:col-span-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-[#00d4aa]/20 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-mono text-[#00d4aa]/60 tracking-widest">{FEATURES[5].tag}</span>
                <h3 className="text-base font-semibold mt-1">{FEATURES[5].title}</h3>
                <p className="text-sm text-white/40 mt-1 max-w-lg">{FEATURES[5].desc}</p>
              </div>
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-[#00d4aa]" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["CSV — Comma Separated Values", "XLSX — Microsoft Excel", "JSON — JavaScript Object Notation"].map((f) => (
                <div key={f} className="rounded-lg border border-dashed border-white/15 p-3 text-center">
                  <div className="text-[10px] font-mono text-[#00d4aa]/60">{f.split(" — ")[0]}</div>
                  <div className="text-[9px] text-white/30 mt-0.5">{f.split(" — ")[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="mb-16">
            <div className="text-[11px] font-mono text-[#00d4aa]/60 tracking-widest mb-3">CARA KERJA</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              5 langkah dari data<br />
              <span className="text-white/40">ke insight bisnis.</span>
            </h2>
          </div>

          {/* Steps — horizontal with connector */}
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {STEPS.map((step, i) => (
                <div key={step.n} className="relative">
                  {/* Number badge */}
                  <div className="w-12 h-12 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/5 flex items-center justify-center mb-4 relative z-10">
                    <span className="text-[#00d4aa] font-mono font-bold text-sm">{step.n}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Agent Showcase ──────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left: copy */}
            <div>
              <div className="text-[11px] font-mono text-[#00d4aa]/60 tracking-widest mb-3">SWARM INTELLIGENCE</div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                4 Agen AI bekerja<br />
                <span className="text-white/40">secara bersamaan.</span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-8">
                Terinspirasi dari arsitektur MiroFish, setiap agen memiliki perspektif unik tentang bisnis Anda.
                Mereka berkolaborasi untuk menghasilkan proyeksi cashflow yang lebih akurat dari analisis tunggal.
              </p>
              <button
                onClick={() => setLocation("/demo")}
                className="flex items-center gap-2 text-sm text-[#00d4aa] hover:text-[#00bfa0] transition-colors"
              >
                Lihat Simulasi Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: agent cards */}
            <div className="grid grid-cols-2 gap-3">
              {AGENTS.map((agent) => (
                <div
                  key={agent.name}
                  className={`rounded-xl border ${agent.border} ${agent.bg} p-5 hover:border-opacity-60 transition-all`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: agent.color }} />
                    <span className="font-mono font-bold text-sm" style={{ color: agent.color }}>{agent.name}</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{agent.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {/* Gradient border card */}
          <div
            className="relative rounded-2xl p-px overflow-hidden"
            style={{ background: "linear-gradient(135deg, #00d4aa30, #34d39920, transparent, #00d4aa20)" }}
          >
            <div className="rounded-2xl bg-[#060a08] px-10 py-16 text-center relative overflow-hidden">
              {/* Glow */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-15 pointer-events-none"
                style={{ background: "radial-gradient(ellipse, #00d4aa 0%, transparent 70%)", filter: "blur(60px)" }}
              />
              <div className="relative">
                <div className="text-[11px] font-mono text-[#00d4aa]/60 tracking-widest mb-4">MULAI SEKARANG</div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Siap memprediksi cashflow<br />bisnis Anda?
                </h2>
                <p className="text-white/40 text-base mb-10 max-w-md mx-auto">
                  Mulai dengan Quick Demo — tidak perlu daftar, langsung lihat semua fitur dalam 5 menit.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setLocation("/demo")}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00d4aa] text-[#060a08] font-semibold text-sm hover:bg-[#00bfa0] transition-all hover:shadow-[0_0_24px_rgba(0,212,170,0.3)]"
                  >
                    <Zap className="w-4 h-4" />
                    Quick Demo
                  </button>
                  <button
                    onClick={() => isAuthenticated ? setLocation("/dashboard") : window.location.assign(getLoginUrl())}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 text-white/70 text-sm hover:border-white/30 hover:text-white transition-all"
                  >
                    Buka Dashboard
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#00d4aa] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-[#060a08]" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-sm">AkunFish</span>
              </div>
              <p className="text-xs text-white/30 leading-relaxed">
                UMKM Financial Intelligence Platform.<br />
                Dibangun untuk LovHacks Season 2.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className="text-[10px] font-mono text-white/30 tracking-widest mb-3">PRODUK</div>
              <div className="space-y-2">
                {[
                  { label: "Dashboard", path: "/dashboard" },
                  { label: "Simulasi", path: "/simulation" },
                  { label: "Laporan", path: "/reports" },
                  { label: "Quick Demo", path: "/demo" },
                ].map((l) => (
                  <button key={l.path} onClick={() => setLocation(l.path)} className="block text-xs text-white/40 hover:text-white transition-colors">
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fitur */}
            <div>
              <div className="text-[10px] font-mono text-white/30 tracking-widest mb-3">FITUR</div>
              <div className="space-y-2">
                {["Accounting", "Swarm AI", "Risk Alert", "Import CSV", "Pitch Deck"].map((f) => (
                  <div key={f} className="text-xs text-white/40">{f}</div>
                ))}
              </div>
            </div>

            {/* Hackathon */}
            <div>
              <div className="text-[10px] font-mono text-white/30 tracking-widest mb-3">HACKATHON</div>
              <div className="space-y-2">
                <div className="text-xs text-white/40">LovHacks Season 2</div>
                <div className="text-xs text-white/40">Kategori: Fintech UMKM</div>
                <div className="text-xs text-white/40">Engine: MiroFish</div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
                  <span className="text-[9px] font-mono text-[#00d4aa]/80">SUBMISSION READY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/20 font-mono">© 2026 AKUNFISH · BUILT FOR LOVHACKS SEASON 2</p>
            <p className="text-[11px] text-white/20 font-mono">POWERED BY MIROFISH SWARM ENGINE · LLM MULTI-AGENT</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
