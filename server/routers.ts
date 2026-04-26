import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createTransaction,
  deleteTransaction,
  getMonthlyTrends,
  getTransactionKPIs,
  getTransactionsByUser,
  createSimulation,
  getSimulationById,
  getSimulationsByUser,
  updateSimulation,
  createAgentLog,
  getAgentLogsBySimulation,
  createReport,
  getReportsByUser,
  getReportById,
} from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatUSD(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function buildAgentSystemPrompt(
  agentType: "owner" | "supplier" | "customer" | "bank" | "report",
  seedText: string,
  scenarioParams: Record<string, unknown>
): string {
  const scenarioDesc = Object.entries(scenarioParams)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const personas: Record<string, string> = {
    owner: `You are the UMKM business owner agent in a financial simulation. You have full knowledge of the business finances described below. You are pragmatic, concerned about cashflow, and want to grow the business sustainably. Respond from the owner's perspective with realistic business insights.`,
    supplier: `You are a supplier agent in a financial simulation. You supply raw materials and goods to the UMKM business. You are concerned about payment terms, order volumes, and pricing. Respond from a supplier's perspective.`,
    customer: `You are a customer agent in a financial simulation. You buy products/services from the UMKM business. You are price-sensitive and care about product quality and delivery. Respond from a customer's perspective.`,
    bank: `You are a bank/financial institution agent in a financial simulation. You evaluate the business's creditworthiness, cashflow health, and loan eligibility. Respond from a banker's analytical perspective.`,
    report: `You are the ReportAgent — an AI financial analyst specializing in UMKM businesses in Indonesia. You analyze simulation results and generate comprehensive reports in Bahasa Indonesia. Be clear, actionable, and use simple language that non-financial users can understand.`,
  };

  return `${personas[agentType]}

=== BUSINESS FINANCIAL DATA (SEED) ===
${seedText}

=== SCENARIO PARAMETERS ===
${scenarioDesc || "No scenario changes applied"}

=== YOUR ROLE ===
Answer questions and provide insights based on this financial context. Be specific, realistic, and helpful. Keep responses concise (2-4 paragraphs max).`;
}

async function generateSeedText(
  transactions: Array<{ type: string; category: string; amount: string; transactionDate: number; description?: string | null }>
): Promise<string> {
  if (transactions.length === 0) return "No transaction data available.";

  const grouped: Record<string, { income: number; expense: number; invoice: number }> = {};
  for (const tx of transactions) {
    const month = new Date(tx.transactionDate).toISOString().slice(0, 7);
    if (!grouped[month]) grouped[month] = { income: 0, expense: 0, invoice: 0 };
    const amt = parseFloat(tx.amount);
    if (tx.type === "income") grouped[month].income += amt;
    else if (tx.type === "expense") grouped[month].expense += amt;
    else if (tx.type === "invoice") grouped[month].invoice += amt;
  }

  const lines: string[] = ["=== MONTHLY FINANCIAL SUMMARY ==="];
  for (const [month, data] of Object.entries(grouped).sort()) {
    const net = data.income - data.expense;
    lines.push(
      `${month}: Income ${formatUSD(data.income)}, Expense ${formatUSD(data.expense)}, Invoice ${formatUSD(data.invoice)}, Net ${formatUSD(net)}`
    );
  }

  const categories: Record<string, number> = {};
  for (const tx of transactions) {
    categories[tx.category] = (categories[tx.category] || 0) + parseFloat(tx.amount);
  }
  lines.push("\n=== TOP SPENDING CATEGORIES ===");
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([cat, amt]) => lines.push(`${cat}: ${formatUSD(amt)}`));

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
  const avgMonthlyIncome = totalIncome / Math.max(Object.keys(grouped).length, 1);
  const avgMonthlyExpense = totalExpense / Math.max(Object.keys(grouped).length, 1);

  lines.push("\n=== BUSINESS METRICS ===");
  lines.push(`Total Income: ${formatUSD(totalIncome)}`);
  lines.push(`Total Expense: ${formatUSD(totalExpense)}`);
  lines.push(`Net Balance: ${formatUSD(totalIncome - totalExpense)}`);
  lines.push(`Avg Monthly Income: ${formatUSD(avgMonthlyIncome)}`);
  lines.push(`Avg Monthly Expense: ${formatUSD(avgMonthlyExpense)}`);
  lines.push(`Cashflow Ratio: ${totalExpense > 0 ? ((totalIncome / totalExpense) * 100).toFixed(1) : "N/A"}%`);

  return lines.join("\n");
}

async function runSwarmSimulation(
  seedText: string,
  scenarioParams: Record<string, unknown>,
  forecastMonths: number
): Promise<{
  cashflowForecast: Array<{ month: string; income: number; expense: number; net: number; confidence: number }>;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskAlerts: Array<{ severity: string; title: string; description: string }>;
  agentInsights: Record<string, string>;
}> {
  const priceChange = (scenarioParams.priceChange as number) ?? 0;
  const employeeCount = (scenarioParams.employeeCount as number) ?? 0;
  const inventoryBudget = (scenarioParams.inventoryBudget as number) ?? 0;
  const marketGrowth = (scenarioParams.marketGrowth as number) ?? 0;

  const agentTypes = ["owner", "supplier", "customer", "bank"] as const;
  const agentInsights: Record<string, string> = {};

  // Run each agent in parallel via LLM
  await Promise.all(
    agentTypes.map(async (agentType) => {
      try {
        const systemPrompt = buildAgentSystemPrompt(agentType, seedText, scenarioParams);
        const userPrompt = `Based on the financial data and scenario parameters, provide your ${agentType} perspective on:
1. What are the key financial risks you see for the next ${forecastMonths} months?
2. What is your prediction for business performance?
3. What is your specific recommendation?
Keep your response focused and practical (max 3 paragraphs).`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const rawInsight = response.choices[0]?.message?.content;
        agentInsights[agentType] = typeof rawInsight === "string" ? rawInsight : "No insight available.";
      } catch {
        agentInsights[agentType] = `${agentType} agent analysis unavailable.`;
      }
    })
  );

  // Generate cashflow forecast using LLM with structured output
  const forecastPrompt = `You are a financial forecasting AI. Based on the following business data, generate a realistic ${forecastMonths}-month cashflow forecast.

${seedText}

SCENARIO ADJUSTMENTS:
- Price change: ${priceChange > 0 ? "+" : ""}${priceChange}%
- New employees: ${employeeCount} (each adds ~IDR 3,500,000/month expense)
- Additional inventory budget: ${formatUSD(inventoryBudget)}/month
- Market growth assumption: ${marketGrowth > 0 ? "+" : ""}${marketGrowth}%

Generate a JSON array with exactly ${forecastMonths} months of forecast data. Each month should be realistic based on the historical data trends with the scenario adjustments applied.`;

  let cashflowForecast: Array<{ month: string; income: number; expense: number; net: number; confidence: number }> = [];

  try {
    const forecastResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a financial forecasting AI. Always respond with valid JSON only, no markdown.",
        },
        { role: "user", content: forecastPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cashflow_forecast",
          strict: true,
          schema: {
            type: "object",
            properties: {
              forecast: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    month: { type: "string", description: "Month label e.g. 2026-04" },
                    income: { type: "number", description: "Predicted income in IDR" },
                    expense: { type: "number", description: "Predicted expense in IDR" },
                    net: { type: "number", description: "Net cashflow (income - expense)" },
                    confidence: { type: "number", description: "Confidence score 0-100" },
                  },
                  required: ["month", "income", "expense", "net", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["forecast"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawForecast = forecastResponse.choices[0]?.message?.content;
    const parsed = JSON.parse(typeof rawForecast === "string" ? rawForecast : "{}");
    cashflowForecast = parsed.forecast ?? [];
  } catch {
    // Fallback: generate simple forecast from seed data
    const now = new Date();
    for (let i = 1; i <= forecastMonths; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.toISOString().slice(0, 7);
      const baseIncome = 15000000 * (1 + marketGrowth / 100) * (1 + priceChange / 100);
      const baseExpense = 11000000 + employeeCount * 3500000 + inventoryBudget;
      cashflowForecast.push({
        month,
        income: Math.round(baseIncome),
        expense: Math.round(baseExpense),
        net: Math.round(baseIncome - baseExpense),
        confidence: 65,
      });
    }
  }

  // Determine risk level and alerts
  const negativeMonths = cashflowForecast.filter((m) => m.net < 0).length;
  const avgNet = cashflowForecast.reduce((s, m) => s + m.net, 0) / Math.max(cashflowForecast.length, 1);
  const minNet = Math.min(...cashflowForecast.map((m) => m.net));

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (negativeMonths >= forecastMonths) riskLevel = "critical";
  else if (negativeMonths >= 2 || minNet < -5000000) riskLevel = "high";
  else if (negativeMonths >= 1 || avgNet < 2000000) riskLevel = "medium";

  const riskAlerts: Array<{ severity: string; title: string; description: string }> = [];
  if (negativeMonths > 0) {
    riskAlerts.push({
      severity: negativeMonths >= 2 ? "critical" : "high",
      title: "Risiko Cashflow Negatif",
      description: `Prediksi menunjukkan ${negativeMonths} bulan dengan cashflow negatif. Perlu perhatian segera.`,
    });
  }
  if (employeeCount > 0) {
    riskAlerts.push({
      severity: "medium",
      title: "Peningkatan Biaya Tenaga Kerja",
      description: `Penambahan ${employeeCount} karyawan akan meningkatkan biaya operasional sebesar ${formatUSD(employeeCount * 3500000)}/bulan.`,
    });
  }
  if (inventoryBudget > 5000000) {
    riskAlerts.push({
      severity: "medium",
      title: "Anggaran Inventaris Tinggi",
      description: `Anggaran inventaris ${formatUSD(inventoryBudget)}/bulan dapat menekan cashflow jika penjualan tidak meningkat.`,
    });
  }
  if (avgNet > 5000000) {
    riskAlerts.push({
      severity: "low",
      title: "Cashflow Sehat",
      description: `Rata-rata cashflow positif ${formatUSD(avgNet)}/bulan menunjukkan kondisi keuangan yang baik.`,
    });
  }

  return { cashflowForecast, riskLevel, riskAlerts, agentInsights };
}

// ─── Routers ──────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Transactions ──────────────────────────────────────────────────────────
  transactions: router({
    create: protectedProcedure
      .input(
        z.object({
          type: z.enum(["income", "expense", "invoice"]),
          category: z.string().min(1).max(128),
          description: z.string().optional(),
          amount: z.number().positive(),
          transactionDate: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createTransaction({
          userId: ctx.user.id,
          type: input.type,
          category: input.category,
          description: input.description,
          amount: input.amount.toString(),
          transactionDate: input.transactionDate,
          notes: input.notes,
        });
        return { success: true };
      }),

    list: protectedProcedure
      .input(
        z.object({
          type: z.enum(["income", "expense", "invoice"]).optional(),
          fromDate: z.number().optional(),
          toDate: z.number().optional(),
          limit: z.number().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return getTransactionsByUser(ctx.user.id, input ?? {});
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),

    kpis: protectedProcedure
      .input(z.object({ fromDate: z.number().optional(), toDate: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getTransactionKPIs(ctx.user.id, input?.fromDate, input?.toDate);
      }),

    monthlyTrends: protectedProcedure
      .input(z.object({ months: z.number().min(1).max(24).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getMonthlyTrends(ctx.user.id, input?.months ?? 6);
      }),

    bulkImport: protectedProcedure
      .input(
        z.object({
          rows: z.array(
            z.object({
              type: z.enum(["income", "expense", "invoice"]),
              category: z.string().min(1).max(128),
              description: z.string().optional(),
              amount: z.number().positive(),
              transactionDate: z.number(),
              notes: z.string().optional(),
            })
          ).min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        let imported = 0;
        const errors: string[] = [];
        for (const row of input.rows) {
          try {
            await createTransaction({
              userId: ctx.user.id,
              type: row.type,
              category: row.category,
              description: row.description,
              amount: row.amount.toString(),
              transactionDate: row.transactionDate,
              notes: row.notes,
            });
            imported++;
          } catch (e) {
            errors.push(`Row ${imported + errors.length + 1}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
        return { imported, skipped: errors.length, errors: errors.slice(0, 10) };
      }),
  }),

  // ─── Simulations ───────────────────────────────────────────────────────────
  simulations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getSimulationsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const sim = await getSimulationById(input.id);
        if (!sim || sim.userId !== ctx.user.id) throw new Error("Simulation not found");
        return sim;
      }),

    generateSeed: protectedProcedure
      .input(z.object({ months: z.number().min(1).max(12).default(6) }))
      .mutation(async ({ ctx, input }) => {
        const fromDate = Date.now() - input.months * 30 * 24 * 60 * 60 * 1000;
        const txs = await getTransactionsByUser(ctx.user.id, { fromDate });
        const seedText = await generateSeedText(txs);
        return { seedText, transactionCount: txs.length };
      }),

    run: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          seedText: z.string().min(1),
          forecastMonths: z.number().min(1).max(6).default(3),
          scenarioParams: z.object({
            priceChange: z.number().min(-50).max(100).default(0),
            employeeCount: z.number().min(0).max(20).default(0),
            inventoryBudget: z.number().min(0).default(0),
            marketGrowth: z.number().min(-50).max(100).default(0),
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Create simulation record
        const insertResult = await createSimulation({
          userId: ctx.user.id,
          title: input.title,
          status: "running",
          seedText: input.seedText,
          scenarioParams: input.scenarioParams,
          forecastMonths: input.forecastMonths,
        });
        const simId = (insertResult as { insertId: number }).insertId;

        try {
          const results = await runSwarmSimulation(
            input.seedText,
            input.scenarioParams as Record<string, unknown>,
            input.forecastMonths
          );

          await updateSimulation(simId, {
            status: "completed",
            cashflowForecast: results.cashflowForecast,
            riskLevel: results.riskLevel,
            riskAlerts: results.riskAlerts,
            agentInsights: results.agentInsights,
          });

          return { simulationId: simId, ...results };
        } catch (err) {
          await updateSimulation(simId, { status: "failed" });
          throw err;
        }
      }),
  }),

  // ─── Agent Chat ────────────────────────────────────────────────────────────
  agentChat: router({
    getLogs: protectedProcedure
      .input(z.object({ simulationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const sim = await getSimulationById(input.simulationId);
        if (!sim || sim.userId !== ctx.user.id) throw new Error("Simulation not found");
        return getAgentLogsBySimulation(input.simulationId);
      }),

    sendMessage: protectedProcedure
      .input(
        z.object({
          simulationId: z.number(),
          agentType: z.enum(["owner", "supplier", "customer", "bank", "report"]),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const sim = await getSimulationById(input.simulationId);
        if (!sim || sim.userId !== ctx.user.id) throw new Error("Simulation not found");

        // Save user message
        await createAgentLog({
          simulationId: input.simulationId,
          userId: ctx.user.id,
          agentType: input.agentType,
          role: "user",
          content: input.message,
        });

        // Get conversation history for context
        const history = await getAgentLogsBySimulation(input.simulationId);
        const agentHistory = history
          .filter((l) => l.agentType === input.agentType)
          .slice(-10); // last 10 messages for context

        const systemPrompt = buildAgentSystemPrompt(
          input.agentType,
          sim.seedText ?? "",
          (sim.scenarioParams as Record<string, unknown>) ?? {}
        );

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...agentHistory.map((l) => ({
            role: (l.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: l.content,
          })),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const rawReply = response.choices[0]?.message?.content;
        const agentReply = typeof rawReply === "string" ? rawReply : "Maaf, saya tidak dapat merespons saat ini.";

        // Save agent reply
        await createAgentLog({
          simulationId: input.simulationId,
          userId: ctx.user.id,
          agentType: input.agentType,
          role: "agent",
          content: agentReply,
        });

        return { reply: agentReply };
      }),
  }),

  // ─── Reports ───────────────────────────────────────────────────────────────
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getReportsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const report = await getReportById(input.id);
        if (!report || report.userId !== ctx.user.id) throw new Error("Report not found");
        return report;
      }),

    generate: protectedProcedure
      .input(z.object({ simulationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sim = await getSimulationById(input.simulationId);
        if (!sim || sim.userId !== ctx.user.id) throw new Error("Simulation not found");
        if (sim.status !== "completed") throw new Error("Simulation not completed yet");

        const forecast = (sim.cashflowForecast as Array<{ month: string; income: number; expense: number; net: number; confidence: number }>) ?? [];
        const alerts = (sim.riskAlerts as Array<{ severity: string; title: string; description: string }>) ?? [];
        const insights = (sim.agentInsights as Record<string, string>) ?? {};

        const reportPrompt = `Kamu adalah ReportAgent — analis keuangan AI yang ahli dalam bisnis UMKM Indonesia.

Buat laporan keuangan komprehensif dalam Bahasa Indonesia berdasarkan data simulasi berikut:

=== DATA KEUANGAN (SEED) ===
${sim.seedText}

=== PARAMETER SKENARIO ===
${JSON.stringify(sim.scenarioParams, null, 2)}

=== PREDIKSI CASHFLOW (${sim.forecastMonths} BULAN) ===
${forecast.map((m) => `${m.month}: Pemasukan ${formatUSD(m.income)}, Pengeluaran ${formatUSD(m.expense)}, Net ${formatUSD(m.net)}, Kepercayaan ${m.confidence}%`).join("\n")}

=== TINGKAT RISIKO: ${sim.riskLevel?.toUpperCase()} ===

=== WAWASAN AGEN ===
Pemilik: ${insights.owner ?? "N/A"}
Supplier: ${insights.supplier ?? "N/A"}
Pelanggan: ${insights.customer ?? "N/A"}
Bank: ${insights.bank ?? "N/A"}

Buat laporan dengan struktur berikut (gunakan Markdown):
1. **Ringkasan Eksekutif** (2-3 kalimat)
2. **Analisis Kondisi Keuangan Saat Ini**
3. **Prediksi Cashflow ${sim.forecastMonths} Bulan ke Depan**
4. **Peringatan Risiko & Rekomendasi**
5. **Strategi Aksi yang Disarankan** (3-5 poin konkret)
6. **Kesimpulan**

Gunakan bahasa yang mudah dipahami oleh pemilik UMKM. Sertakan angka spesifik dari data.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Kamu adalah analis keuangan UMKM Indonesia yang berpengalaman. Selalu tulis dalam Bahasa Indonesia yang jelas dan mudah dipahami." },
            { role: "user", content: reportPrompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "Laporan tidak dapat dibuat.";
        const summary = content.split("\n").slice(0, 5).join(" ").substring(0, 300);

        const insertResult = await createReport({
          simulationId: input.simulationId,
          userId: ctx.user.id,
          title: `Laporan Simulasi: ${sim.title}`,
          content,
          summary,
        });

        return {
          reportId: (insertResult as { insertId: number }).insertId,
          content,
          summary,
          riskLevel: sim.riskLevel,
          alerts,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
