import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  InsertTransaction,
  InsertSimulation,
  InsertAgentLog,
  InsertReport,
  agentLogs,
  reports,
  simulations,
  transactions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(transactions).values(data);
  return result;
}

export async function getTransactionsByUser(
  userId: number,
  opts?: { type?: "income" | "expense" | "invoice"; fromDate?: number; toDate?: number; limit?: number }
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(transactions.userId, userId)];
  if (opts?.type) conditions.push(eq(transactions.type, opts.type));
  if (opts?.fromDate) conditions.push(gte(transactions.transactionDate, opts.fromDate));
  if (opts?.toDate) conditions.push(lte(transactions.transactionDate, opts.toDate));
  return db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.transactionDate))
    .limit(opts?.limit ?? 200);
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function getTransactionKPIs(userId: number, fromDate?: number, toDate?: number) {
  const db = await getDb();
  if (!db) return { totalIncome: 0, totalExpense: 0, totalInvoice: 0, balance: 0 };

  const conditions = [eq(transactions.userId, userId)];
  if (fromDate) conditions.push(gte(transactions.transactionDate, fromDate));
  if (toDate) conditions.push(lte(transactions.transactionDate, toDate));

  const rows = await db
    .select({
      type: transactions.type,
      total: sql<string>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.type);

  let totalIncome = 0;
  let totalExpense = 0;
  let totalInvoice = 0;
  for (const row of rows) {
    const v = parseFloat(row.total ?? "0");
    if (row.type === "income") totalIncome = v;
    else if (row.type === "expense") totalExpense = v;
    else if (row.type === "invoice") totalInvoice = v;
  }
  return { totalIncome, totalExpense, totalInvoice, balance: totalIncome - totalExpense };
}

export async function getMonthlyTrends(userId: number, months: number = 6) {
  const db = await getDb();
  if (!db) return [];
  const fromMs = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
  const monthExpr = sql<string>`DATE_FORMAT(FROM_UNIXTIME(${transactions.transactionDate}/1000), '%Y-%m')`;
  const rows = await db
    .select({
      type: transactions.type,
      month: monthExpr,
      total: sql<string>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.transactionDate, fromMs)))
    .groupBy(transactions.type, monthExpr)
    .orderBy(monthExpr);
  return rows;
}

// ─── Simulations ──────────────────────────────────────────────────────────────
export async function createSimulation(data: InsertSimulation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(simulations).values(data);
  return result;
}

export async function getSimulationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
  return result[0];
}

export async function updateSimulation(id: number, data: Partial<InsertSimulation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(simulations).set(data).where(eq(simulations.id, id));
}

export async function getSimulationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(simulations)
    .where(eq(simulations.userId, userId))
    .orderBy(desc(simulations.createdAt))
    .limit(20);
}

// ─── Agent Logs ───────────────────────────────────────────────────────────────
export async function createAgentLog(data: InsertAgentLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(agentLogs).values(data);
  return result;
}

export async function getAgentLogsBySimulation(simulationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(agentLogs)
    .where(eq(agentLogs.simulationId, simulationId))
    .orderBy(agentLogs.createdAt);
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function createReport(data: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(reports).values(data);
  return result;
}

export async function getReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(20);
}

export async function getReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}
