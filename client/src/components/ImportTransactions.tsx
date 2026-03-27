/**
 * ImportTransactions — drag-and-drop file import for CSV, XLSX, and JSON.
 *
 * Flow:
 *   1. Drop / select file  →  parse with PapaParse (CSV) or xlsx (Excel) or JSON.parse
 *   2. Column mapper       →  map raw headers to required fields
 *   3. Preview table       →  review first 20 rows, fix type/amount
 *   4. Confirm import      →  bulk-insert via tRPC, show result summary
 */

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle2, X, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RawRow = Record<string, string>;

type MappedField = "type" | "category" | "description" | "amount" | "date" | "notes" | "__skip__";

interface ColumnMap {
  [rawHeader: string]: MappedField;
}

interface ParsedRow {
  type: "income" | "expense" | "invoice";
  category: string;
  description?: string;
  amount: number;
  transactionDate: number;
  notes?: string;
  _raw: RawRow;
  _error?: string;
}

type Step = "upload" | "map" | "preview" | "result";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS: MappedField[] = ["type", "amount", "date"];

const FIELD_LABELS: Record<MappedField, string> = {
  type: "Type (income/expense/invoice)",
  category: "Category",
  description: "Description",
  amount: "Amount (IDR)",
  date: "Date",
  notes: "Notes",
  __skip__: "— Skip this column —",
};

/** Guess which raw header maps to which field based on common naming patterns. */
function autoDetectMapping(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  for (const h of headers) {
    const lower = h.toLowerCase().replace(/[\s_-]/g, "");
    if (["type", "tipe", "jenis", "kategoritransaksi"].includes(lower)) map[h] = "type";
    else if (["category", "kategori", "kat"].includes(lower)) map[h] = "category";
    else if (["description", "deskripsi", "keterangan", "desc", "nama"].includes(lower)) map[h] = "description";
    else if (["amount", "jumlah", "nominal", "nilai", "total", "harga"].includes(lower)) map[h] = "amount";
    else if (["date", "tanggal", "tgl", "transactiondate", "waktu"].includes(lower)) map[h] = "date";
    else if (["notes", "catatan", "note", "memo"].includes(lower)) map[h] = "notes";
    else map[h] = "__skip__";
  }
  return map;
}

/** Normalise a raw type string to income | expense | invoice. */
function normaliseType(raw: string): "income" | "expense" | "invoice" | null {
  const v = raw.toLowerCase().trim();
  if (["income", "pemasukan", "masuk", "in", "pendapatan"].includes(v)) return "income";
  if (["expense", "pengeluaran", "keluar", "out", "biaya", "cost"].includes(v)) return "expense";
  if (["invoice", "tagihan", "piutang"].includes(v)) return "invoice";
  return null;
}

/** Parse a date string or Excel serial number to a UTC timestamp (ms). */
function parseDate(raw: string | number): number | null {
  if (typeof raw === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(raw);
    if (date) return new Date(date.y, date.m - 1, date.d).getTime();
  }
  const str = String(raw).trim();
  // Try each pattern in order: ISO, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const dt = new Date(+isoMatch[1], +isoMatch[2] - 1, +isoMatch[3]);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  const dmySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmySlash) {
    const dt = new Date(+dmySlash[3], +dmySlash[2] - 1, +dmySlash[1]);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  const dmyDash = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dmyDash) {
    const dt = new Date(+dmyDash[3], +dmyDash[2] - 1, +dmyDash[1]);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  const ymdSlash = str.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (ymdSlash) {
    const dt = new Date(+ymdSlash[1], +ymdSlash[2] - 1, +ymdSlash[3]);
    if (!isNaN(dt.getTime())) return dt.getTime();
  }
  // Fallback: native Date parse
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

/** Parse a numeric string, stripping currency symbols and thousand separators. */
function parseAmount(raw: string | number): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  const cleaned = String(raw).replace(/[Rp\s.,]/g, "").replace(",", "");
  // Handle Indonesian format: 1.500.000 → 1500000
  const num = parseFloat(cleaned.replace(/\./g, ""));
  return isNaN(num) || num <= 0 ? null : num;
}

/** Convert raw rows + column map into validated ParsedRow[]. */
function applyMapping(rawRows: RawRow[], colMap: ColumnMap): ParsedRow[] {
  return rawRows.map((raw, i) => {
    const errors: string[] = [];

    // Collect values by mapped field
    const values: Partial<Record<MappedField, string>> = {};
    for (const [header, field] of Object.entries(colMap)) {
      if (field !== "__skip__" && raw[header] !== undefined) {
        values[field] = raw[header];
      }
    }

    // type
    const rawType = values.type ?? "";
    const type = normaliseType(rawType);
    if (!type) errors.push(`Row ${i + 2}: Unknown type "${rawType}" — expected income/expense/invoice`);

    // amount
    const rawAmount = values.amount ?? "";
    const amount = parseAmount(rawAmount);
    if (amount === null) errors.push(`Row ${i + 2}: Invalid amount "${rawAmount}"`);

    // date
    const rawDate = values.date ?? "";
    const transactionDate = parseDate(rawDate);
    if (transactionDate === null) errors.push(`Row ${i + 2}: Invalid date "${rawDate}"`);

    // category (optional — default to type label)
    const category = (values.category ?? "").trim() || (type ? type.charAt(0).toUpperCase() + type.slice(1) : "Import");

    return {
      type: (type ?? "expense") as "income" | "expense" | "invoice",
      category,
      description: (values.description ?? "").trim() || undefined,
      amount: amount ?? 0,
      transactionDate: transactionDate ?? Date.now(),
      notes: (values.notes ?? "").trim() || undefined,
      _raw: raw,
      _error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportTransactions({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [colMap, setColMap] = useState<ColumnMap>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bulkImport = trpc.transactions.bulkImport.useMutation();

  const reset = () => {
    setStep("upload");
    setFileName("");
    setRawHeaders([]);
    setRawRows([]);
    setColMap({});
    setParsedRows([]);
    setImportResult(null);
    setIsDragging(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── File parsing ──────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const rows: RawRow[] = Array.isArray(data) ? data : [data];
          if (rows.length === 0) { toast.error("JSON file is empty."); return; }
          const headers = Object.keys(rows[0]);
          setRawHeaders(headers);
          setRawRows(rows.map((r) => Object.fromEntries(headers.map((h) => [h, String(r[h] ?? "")]))));
          setColMap(autoDetectMapping(headers));
          setStep("map");
        } catch {
          toast.error("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
      return;
    }

    if (ext === "xlsx" || ext === "xls" || ext === "ods") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json: RawRow[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
          if (json.length === 0) { toast.error("Spreadsheet is empty."); return; }
          const headers = Object.keys(json[0]);
          setRawHeaders(headers);
          setRawRows(json.map((r) => Object.fromEntries(headers.map((h) => [h, String(r[h] ?? "")]))));
          setColMap(autoDetectMapping(headers));
          setStep("map");
        } catch {
          toast.error("Could not read spreadsheet file.");
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Default: CSV / TSV
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0) { toast.error("CSV file is empty."); return; }
        const headers = result.meta.fields ?? [];
        setRawHeaders(headers);
        setRawRows(result.data);
        setColMap(autoDetectMapping(headers));
        setStep("map");
      },
      error: () => toast.error("Could not parse CSV file."),
    });
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Column mapper ─────────────────────────────────────────────────────────

  const missingRequired = REQUIRED_FIELDS.filter(
    (f) => !Object.values(colMap).includes(f)
  );

  // Detect fields mapped more than once (excluding __skip__)
  const fieldCounts: Partial<Record<MappedField, number>> = {};
  for (const f of Object.values(colMap)) {
    if (f !== "__skip__") fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
  }
  const duplicateMappings = (Object.entries(fieldCounts) as [MappedField, number][])
    .filter(([, count]) => count > 1)
    .map(([f]) => FIELD_LABELS[f]);

  const goToPreview = () => {
    const mapped = applyMapping(rawRows, colMap);
    setParsedRows(mapped);
    setStep("preview");
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const confirmImport = async () => {
    const validRows = parsedRows.filter((r) => !r._error);
    if (validRows.length === 0) {
      toast.error("No valid rows to import.");
      return;
    }
    try {
      const result = await bulkImport.mutateAsync({
        rows: validRows.map((r) => ({
          type: r.type,
          category: r.category,
          description: r.description,
          amount: r.amount,
          transactionDate: r.transactionDate,
          notes: r.notes,
        })),
      });
      setImportResult({ ...result, skipped: result.skipped + parsedRows.filter((r) => r._error).length });
      setStep("result");
      onImported();
    } catch (e) {
      toast.error("Import failed: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const errorCount = parsedRows.filter((r) => r._error).length;
  const validCount = parsedRows.length - errorCount;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold">Import Transactions</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Upload a CSV, Excel (.xlsx), or JSON file to bulk-import transactions.
              </DialogDescription>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {(["upload", "map", "preview", "result"] as Step[]).map((s, i, arr) => (
                <span key={s} className="flex items-center gap-1">
                  <span className={`px-2 py-0.5 rounded font-mono ${step === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                  {i < arr.length - 1 && <ChevronRight className="h-3 w-3" />}
                </span>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="flex flex-col gap-6">
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 py-16 cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium text-sm">Drop your file here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports CSV, Excel (.xlsx / .xls), JSON — max 500 rows</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.ods,.json"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>

              {/* Template download hint */}
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-widest">Expected Column Names</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { col: "type", example: "income / expense / invoice" },
                    { col: "date", example: "2025-01-15 or 15/01/2025" },
                    { col: "amount", example: "1500000" },
                    { col: "category", example: "Penjualan (optional)" },
                    { col: "description", example: "Nama item (optional)" },
                    { col: "notes", example: "Catatan (optional)" },
                  ].map(({ col, example }) => (
                    <div key={col} className="text-xs">
                      <span className="font-mono text-primary">{col}</span>
                      <span className="text-muted-foreground ml-1">— {example}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Column names are flexible — you can remap them in the next step. Indonesian column names are also supported.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Column Mapper ── */}
          {step === "map" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-medium">{fileName}</span>
                <Badge variant="secondary" className="font-mono text-xs">{rawRows.length} rows</Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Map each column from your file to the corresponding field. Required fields are marked with *.
              </p>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-card">
                      <TableHead className="text-xs w-1/3">Your Column</TableHead>
                      <TableHead className="text-xs w-1/3">Sample Value</TableHead>
                      <TableHead className="text-xs w-1/3">Maps To *</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawHeaders.map((header) => (
                      <TableRow key={header}>
                        <TableCell className="font-mono text-xs text-primary">{header}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {rawRows[0]?.[header] ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={colMap[header] ?? "__skip__"}
                            onValueChange={(v) => setColMap((prev) => ({ ...prev, [header]: v as MappedField }))}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(FIELD_LABELS) as MappedField[]).map((f) => (
                                <SelectItem key={f} value={f} className="text-xs">
                                  {FIELD_LABELS[f]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {missingRequired.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-destructive border border-destructive/30 bg-destructive/5 rounded p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Required fields not mapped: <strong>{missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}</strong></span>
                </div>
              )}
              {duplicateMappings.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-400 border border-amber-600/30 bg-amber-600/5 rounded p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Duplicate mapping detected: <strong>{duplicateMappings.join(", ")}</strong> — each field must be mapped to exactly one column.</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === "preview" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{parsedRows.length} rows parsed</span>
                <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">{validCount} valid</Badge>
                {errorCount > 0 && (
                  <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">{errorCount} errors</Badge>
                )}
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="text-xs w-8">#</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, i) => (
                        <TableRow key={i} className={row._error ? "bg-destructive/5" : ""}>
                          <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${row.type === "income" ? "border-emerald-600/40 text-emerald-400" : row.type === "expense" ? "border-red-600/40 text-red-400" : "border-amber-600/40 text-amber-400"}`}
                            >
                              {row.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{row.category}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">{row.description ?? "—"}</TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {row.amount > 0 ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(row.amount) : <span className="text-destructive">—</span>}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {row.transactionDate ? new Date(row.transactionDate).toLocaleDateString("id-ID") : <span className="text-destructive">—</span>}
                          </TableCell>
                          <TableCell>
                            {row._error ? (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <X className="h-3 w-3" /> Error
                              </span>
                            ) : (
                              <span className="text-xs text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> OK
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {errorCount > 0 && (
                <div className="border border-destructive/30 bg-destructive/5 rounded p-3 text-xs text-destructive space-y-1">
                  <p className="font-semibold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> {errorCount} rows will be skipped due to errors:</p>
                  {parsedRows.filter((r) => r._error).slice(0, 5).map((r, i) => (
                    <p key={i} className="pl-4 text-muted-foreground">{r._error}</p>
                  ))}
                  {errorCount > 5 && <p className="pl-4 text-muted-foreground">...and {errorCount - 5} more.</p>}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Result ── */}
          {step === "result" && importResult && (
            <div className="flex flex-col items-center gap-6 py-8">
              <CheckCircle2 className="h-14 w-14 text-emerald-400" />
              <div className="text-center">
                <p className="text-lg font-semibold">Import Complete</p>
                <p className="text-sm text-muted-foreground mt-1">Your transactions have been saved to the database.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="border border-border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground mt-1">Imported</p>
                </div>
                <div className="border border-border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skipped</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="w-full border border-destructive/30 bg-destructive/5 rounded p-3 text-xs text-destructive space-y-1">
                  {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-between items-center shrink-0">
          <Button variant="ghost" size="sm" onClick={step === "upload" ? handleClose : () => {
            if (step === "map") setStep("upload");
            else if (step === "preview") setStep("map");
            else handleClose();
          }}>
            {step === "result" ? "Close" : step === "upload" ? "Cancel" : "Back"}
          </Button>

          <div className="flex gap-2">
            {step === "map" && (
              <Button size="sm" onClick={goToPreview} disabled={missingRequired.length > 0 || duplicateMappings.length > 0}>
                Preview {rawRows.length} rows <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
            {step === "preview" && (
              <Button size="sm" onClick={confirmImport} disabled={validCount === 0 || bulkImport.isPending}>
                {bulkImport.isPending ? "Importing..." : `Import ${validCount} rows`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
