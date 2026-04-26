import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Trash2, Plus, X, Upload } from "lucide-react";
import ImportTransactions from "@/components/ImportTransactions";

const INCOME_CATEGORIES = ["Sales Revenue", "Service Fee", "Investment Return", "Loan Received", "Other Income"];
const EXPENSE_CATEGORIES = ["Raw Materials", "Salaries", "Rent", "Utilities", "Marketing", "Equipment", "Transport", "Tax", "Other Expense"];
const INVOICE_CATEGORIES = ["Customer Invoice", "Supplier Invoice", "Government Invoice", "Other Invoice"];

function formatUSD(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Transactions() {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "invoice">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Form state
  const [form, setForm] = useState({
    type: "income" as "income" | "expense" | "invoice",
    category: "",
    description: "",
    amount: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const { data: transactions, isLoading } = trpc.transactions.list.useQuery({
    type: filterType === "all" ? undefined : filterType,
    fromDate: fromDate ? new Date(fromDate).getTime() : undefined,
    toDate: toDate ? new Date(toDate + "T23:59:59").getTime() : undefined,
  });

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.transactions.kpis.invalidate();
      utils.transactions.monthlyTrends.invalidate();
      toast.success("Transaction added");
      setShowForm(false);
      setForm({ type: "income", category: "", description: "", amount: "", transactionDate: new Date().toISOString().slice(0, 10), notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.transactions.kpis.invalidate();
      utils.transactions.monthlyTrends.invalidate();
      toast.success("Transaction deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const categories =
    form.type === "income" ? INCOME_CATEGORIES :
    form.type === "expense" ? EXPENSE_CATEGORIES :
    INVOICE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || !form.transactionDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate({
      type: form.type,
      category: form.category,
      description: form.description || undefined,
      amount: parseFloat(form.amount),
      transactionDate: new Date(form.transactionDate).getTime(),
      notes: form.notes || undefined,
    });
  };

  const typeColor = (type: string) => {
    if (type === "income") return "text-[oklch(0.65_0.12_145)]";
    if (type === "expense") return "text-[oklch(0.60_0.18_25)]";
    return "text-[oklch(0.70_0.12_55)]";
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Record and manage your business transactions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Import File
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-3.5 w-3.5 mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
            {showForm ? "Cancel" : "Add Transaction"}
          </Button>
        </div>
      </div>

      <ImportTransactions
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => {
          utils.transactions.list.invalidate();
          utils.transactions.kpis.invalidate();
          utils.transactions.monthlyTrends.invalidate();
        }}
      />

      {/* Add form */}
      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-medium">New Transaction</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Type */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type, category: "" })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount (IDR) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="h-9 text-sm font-num"
                  min="0"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date *</Label>
                <Input
                  type="date"
                  value={form.transactionDate}
                  onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input
                  placeholder="Optional description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <Button type="submit" size="sm" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {(["all", "income", "expense", "invoice"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                filterType === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 text-xs w-36"
            placeholder="From"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 text-xs w-36"
            placeholder="To"
          />
          {(fromDate || toDate) && (
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setFromDate(""); setToDate(""); }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-left">Date</th>
                <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-left">Type</th>
                <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-left">Category</th>
                <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-left">Description</th>
                <th className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</td>
                </tr>
              ) : !transactions || transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-sm text-muted-foreground mb-3">No transactions found</div>
                    <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Transaction
                    </Button>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-num text-muted-foreground">{formatDate(tx.transactionDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium uppercase ${typeColor(tx.type)}`}>{tx.type}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{tx.category}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{tx.description || "—"}</td>
                    <td className={`px-4 py-3 text-sm font-num text-right font-medium ${typeColor(tx.type)}`}>
                      {tx.type === "expense" ? "−" : "+"}{formatUSD(parseFloat(tx.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteMutation.mutate({ id: tx.id })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
