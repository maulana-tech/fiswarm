/**
 * Unit tests for import parser utilities and the bulkImport tRPC procedure.
 * These tests run server-side only (no DOM required).
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Inline parser helpers (mirrors client/src/components/ImportTransactions.tsx) ──

function normaliseType(raw: string): "income" | "expense" | "invoice" | null {
  const v = raw.toLowerCase().trim();
  if (["income", "pemasukan", "masuk", "in", "pendapatan"].includes(v)) return "income";
  if (["expense", "pengeluaran", "keluar", "out", "biaya", "cost"].includes(v)) return "expense";
  if (["invoice", "tagihan", "piutang"].includes(v)) return "invoice";
  return null;
}

function parseAmount(raw: string | number): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  const cleaned = String(raw).replace(/[Rp\s]/g, "");
  // Handle Indonesian thousand separator (dots) then decimal comma
  const num = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  return isNaN(num) || num <= 0 ? null : num;
}

function parseDate(raw: string | number): number | null {
  if (typeof raw === "number") return null; // skip Excel serial in unit test
  const str = String(raw).trim();
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
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

// ─── normaliseType ─────────────────────────────────────────────────────────────

describe("normaliseType", () => {
  it("maps English income variants", () => {
    expect(normaliseType("income")).toBe("income");
    expect(normaliseType("Income")).toBe("income");
    expect(normaliseType("in")).toBe("income");
  });
  it("maps Indonesian income variants", () => {
    expect(normaliseType("pemasukan")).toBe("income");
    expect(normaliseType("masuk")).toBe("income");
    expect(normaliseType("pendapatan")).toBe("income");
  });
  it("maps expense variants", () => {
    expect(normaliseType("expense")).toBe("expense");
    expect(normaliseType("pengeluaran")).toBe("expense");
    expect(normaliseType("biaya")).toBe("expense");
    expect(normaliseType("cost")).toBe("expense");
    expect(normaliseType("out")).toBe("expense");
  });
  it("maps invoice variants", () => {
    expect(normaliseType("invoice")).toBe("invoice");
    expect(normaliseType("tagihan")).toBe("invoice");
    expect(normaliseType("piutang")).toBe("invoice");
  });
  it("returns null for unknown values", () => {
    expect(normaliseType("unknown")).toBeNull();
    expect(normaliseType("")).toBeNull();
    expect(normaliseType("debit")).toBeNull();
  });
});

// ─── parseAmount ───────────────────────────────────────────────────────────────

describe("parseAmount", () => {
  it("parses plain numbers", () => {
    expect(parseAmount(1500000)).toBe(1500000);
    expect(parseAmount("1500000")).toBe(1500000);
  });
  it("parses Indonesian format with dot thousand separator", () => {
    expect(parseAmount("1.500.000")).toBe(1500000);
    expect(parseAmount("Rp 2.000.000")).toBe(2000000);
  });
  it("parses numbers with Rp prefix and spaces", () => {
    expect(parseAmount("Rp1500000")).toBe(1500000);
  });
  it("returns null for zero or negative", () => {
    expect(parseAmount(0)).toBeNull();
    expect(parseAmount(-100)).toBeNull();
    expect(parseAmount("0")).toBeNull();
  });
  it("returns null for non-numeric strings", () => {
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });
});

// ─── parseDate ─────────────────────────────────────────────────────────────────

describe("parseDate", () => {
  it("parses ISO format YYYY-MM-DD", () => {
    const ts = parseDate("2025-01-15");
    expect(ts).not.toBeNull();
    const d = new Date(ts!);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0); // January
    expect(d.getDate()).toBe(15);
  });
  it("parses DD/MM/YYYY format", () => {
    const ts = parseDate("15/01/2025");
    expect(ts).not.toBeNull();
    const d = new Date(ts!);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
  it("parses DD-MM-YYYY format", () => {
    const ts = parseDate("15-01-2025");
    expect(ts).not.toBeNull();
    const d = new Date(ts!);
    expect(d.getFullYear()).toBe(2025);
  });
  it("parses YYYY/MM/DD format", () => {
    const ts = parseDate("2025/01/15");
    expect(ts).not.toBeNull();
    const d = new Date(ts!);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getDate()).toBe(15);
  });
  it("returns null for invalid dates", () => {
    expect(parseDate("not-a-date")).toBeNull();
    expect(parseDate("hello world")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
  it("does not confuse DD/MM with MM/DD for day > 12", () => {
    const ts = parseDate("25/03/2025");
    expect(ts).not.toBeNull();
    const d = new Date(ts!);
    expect(d.getDate()).toBe(25);
    expect(d.getMonth()).toBe(2); // March
  });
});

// ─── bulkImport procedure ──────────────────────────────────────────────────────

function makeMockCtx(): TrpcContext {
  return {
    user: {
      id: 999,
      openId: "test-import-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("transactions.bulkImport (schema validation)", () => {
  it("rejects empty rows array", async () => {
    const caller = appRouter.createCaller(makeMockCtx());
    await expect(
      caller.transactions.bulkImport({ rows: [] })
    ).rejects.toThrow();
  });

  it("rejects rows exceeding 500 limit", async () => {
    const caller = appRouter.createCaller(makeMockCtx());
    const rows = Array.from({ length: 501 }, (_, i) => ({
      type: "income" as const,
      category: "Test",
      amount: 100000,
      transactionDate: Date.now() - i * 86400000,
    }));
    await expect(caller.transactions.bulkImport({ rows })).rejects.toThrow();
  });

  it("rejects rows with non-positive amount", async () => {
    const caller = appRouter.createCaller(makeMockCtx());
    await expect(
      caller.transactions.bulkImport({
        rows: [{ type: "income", category: "Test", amount: -100, transactionDate: Date.now() }],
      })
    ).rejects.toThrow();
  });

  it("rejects rows with invalid type enum", async () => {
    const caller = appRouter.createCaller(makeMockCtx());
    await expect(
      caller.transactions.bulkImport({
        rows: [{ type: "debit" as "income", category: "Test", amount: 100, transactionDate: Date.now() }],
      })
    ).rejects.toThrow();
  });
});
