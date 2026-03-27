import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Streamdown } from "streamdown";

interface Props { id: number; }

function formatDate(d: Date | number) {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

export default function ReportDetail({ id }: Props) {
  const [, setLocation] = useLocation();
  const { data: report, isLoading } = trpc.reports.get.useQuery({ id });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Memuat laporan...
      </div>
    );
  }

  if (!report) {
    return <div className="p-6 text-muted-foreground">Laporan tidak ditemukan.</div>;
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/reports")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">{report.title}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(report.createdAt)}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5 mr-1.5" />
          Cetak
        </Button>
      </div>

      {/* Summary box */}
      {report.summary && (
        <Card className="bg-card border-border">
          <CardContent className="px-4 py-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ringkasan Eksekutif</div>
            <p className="text-sm leading-relaxed">{report.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Full report content */}
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

      {/* Navigation */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setLocation("/reports")}>
          Kembali ke Daftar Laporan
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLocation(`/simulation/${report.simulationId}`)}>
          Lihat Simulasi
        </Button>
      </div>
    </div>
  );
}
