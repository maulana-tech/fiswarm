import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Loader2,
  Printer,
  Presentation,
  Download,
  X,
  ExternalLink,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { useState } from "react";
import { toast } from "sonner";

// ── SlideCarousel: renders each .slide div from pitch deck HTML as a proper 16:9 preview
function SlideCarousel({ html }: { html: string }) {
  // Parse the full HTML and extract each slide's outer HTML + the <style> block
  const parsed = (() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const styleEl = doc.querySelector("style");
    const styleText = styleEl ? styleEl.outerHTML : "";
    const slides = Array.from(doc.querySelectorAll(".slide"));
    return slides.map((s) => ({
      id: s.id,
      outerHTML: s.outerHTML,
    })).map((s) => ({
      ...s,
      // Wrap each slide in a minimal HTML doc with the shared styles
      doc: `<!DOCTYPE html><html><head><meta charset="UTF-8">${styleText}<style>
        html,body{margin:0;padding:0;background:#0a0a0a;overflow:hidden;}
        .slide{width:1280px;min-height:720px;page-break-after:unset;}
      </style></head><body>${s.outerHTML}</body></html>`,
    }));
  })();

  if (parsed.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-8">No slides found.</p>;
  }

  return (
    <div className="space-y-3">
      {parsed.map((slide, i) => (
        <div key={slide.id} className="relative">
          {/* Slide number label */}
          <div className="text-xs text-muted-foreground mb-1.5 font-mono tracking-wider">
            SLIDE {i + 1} / {parsed.length}
          </div>
          {/* 16:9 aspect ratio container */}
          <div
            className="relative w-full overflow-hidden rounded border border-border bg-[#0a0a0a]"
            style={{ paddingBottom: "56.25%" /* 9/16 = 56.25% */ }}
          >
            <iframe
              srcDoc={slide.doc}
              title={`Slide ${i + 1}`}
              className="absolute inset-0 border-0"
              style={{
                width: "1280px",
                height: "720px",
                transformOrigin: "top left",
                transform: "scale(var(--slide-scale, 1))",
              }}
              onLoad={(e) => {
                // Scale the 1280x720 slide to fit the container width
                const container = (e.target as HTMLIFrameElement).parentElement;
                if (container) {
                  const scale = container.clientWidth / 1280;
                  (e.target as HTMLIFrameElement).style.transform = `scale(${scale})`;
                }
              }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface Props { id: number; }

function formatDate(d: Date | number) {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function riskColor(level?: string | null) {
  if (level === "critical") return "text-red-400 border-red-800 bg-red-950";
  if (level === "high") return "text-orange-400 border-orange-800 bg-orange-950";
  if (level === "medium") return "text-yellow-400 border-yellow-800 bg-yellow-950";
  return "text-green-400 border-green-800 bg-green-950";
}

export default function ReportDetail({ id }: Props) {
  const [, setLocation] = useLocation();
  const { data: report, isLoading } = trpc.reports.get.useQuery({ id });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Fetch HTML preview ──────────────────────────────────────────────────────
  const openPreview = async () => {
    if (!report) return;
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const res = await fetch(`/api/pitch-deck/${report.id}?format=html`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      setPreviewHtml(html);
    } catch (err) {
      toast.error("Failed to load pitch deck preview");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Download PDF ────────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/pitch-deck/${report.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiswarm-pitchdeck-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Pitch deck downloaded!");
    } catch (err) {
      toast.error("Failed to download pitch deck. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading report...
      </div>
    );
  }

  if (!report) {
    return <div className="p-6 text-muted-foreground">Report not found.</div>;
  }

  return (
    <div className="p-6 space-y-5 w-full">

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => setLocation("/reports")}
          className="text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight">{report.title}</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(report.createdAt)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="hidden sm:flex"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={openPreview}
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Presentation className="h-3.5 w-3.5 mr-1.5" />
            Preview Pitch Deck
          </Button>

          <Button
            size="sm"
            onClick={downloadPDF}
            disabled={downloading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5 mr-1.5" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* ── Pitch Deck Info Banner ── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="px-4 py-3">
          <div className="flex items-start gap-3">
            <Presentation className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">Pitch Deck Available</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This report can be exported as a 9-slide PDF pitch deck — covering KPIs, cashflow projections, risk alerts, swarm AI agent insights, and strategic recommendations in Bahasa Indonesia.
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={openPreview}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={downloadPDF} disabled={downloading}>
                {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3 mr-1" />}
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Executive Summary ── */}
      {report.summary && (
        <Card className="bg-card border-border">
          <CardContent className="px-4 py-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Executive Summary</div>
            <p className="text-sm leading-relaxed">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Full report content ── */}
      <Card className="bg-card border-border">
        <CardContent className="px-6 py-5">
          <div className="prose prose-sm prose-invert max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-strong:text-foreground prose-strong:font-semibold
            prose-li:text-muted-foreground
            prose-table:text-sm
            prose-th:text-muted-foreground prose-th:font-medium prose-th:uppercase prose-th:tracking-wider prose-th:text-xs
            prose-td:text-foreground
            prose-hr:border-border
            prose-code:text-primary prose-code:bg-accent prose-code:px-1 prose-code:rounded
          ">
            <Streamdown>{report.content}</Streamdown>
          </div>
        </CardContent>
      </Card>

      {/* ── Navigation ── */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setLocation("/reports")}>
          Back to Reports
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLocation(`/simulation/${report.simulationId}`)}>
          View Simulation
        </Button>
      </div>

      {/* ── Pitch Deck Preview Modal ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[96vw] w-[1100px] max-h-[94vh] p-0 bg-[#0a0a0a] border-border overflow-hidden flex flex-col">
          <DialogHeader className="px-5 py-3 border-b border-border flex-row items-center justify-between shrink-0">
            <DialogTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <Presentation className="h-4 w-4 text-primary" />
              Preview Pitch Deck
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={downloadPDF}
                disabled={downloading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs"
              >
                {downloading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Download PDF
              </Button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>

          {/* Slide preview area — each slide rendered as a 16:9 scaled card */}
          <div className="flex-1 overflow-y-auto bg-[#050505] p-5 space-y-4">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm">Building pitch deck...</p>
              </div>
            ) : previewHtml ? (
              <SlideCarousel html={previewHtml} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
