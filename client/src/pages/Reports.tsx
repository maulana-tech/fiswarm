import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FileText, ChevronRight, Clock } from "lucide-react";

function formatDate(d: Date | number) {
  const date = typeof d === "number" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const { data: reports, isLoading } = trpc.reports.list.useQuery();

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Laporan Keuangan</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan laporan hasil simulasi dalam Bahasa Indonesia
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Memuat laporan...</div>
      ) : !reports || reports.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-medium mb-1">Belum ada laporan</div>
            <div className="text-xs text-muted-foreground mb-4">
              Jalankan simulasi terlebih dahulu, lalu klik "Generate Report" untuk membuat laporan.
            </div>
            <Button size="sm" variant="outline" onClick={() => setLocation("/simulation")}>
              Buka Simulasi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => setLocation(`/reports/${report.id}`)}
            >
              <CardContent className="px-4 py-3 flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{report.title}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(report.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">cashflow</span>
                  </div>
                  {report.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.summary}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
