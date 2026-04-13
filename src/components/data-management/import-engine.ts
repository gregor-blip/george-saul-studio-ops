import { supabase } from "@/integrations/supabase/client";
import {
  REVENUE_TYPES,
  EXPENSE_TYPES,
  type ColumnMapping,
  type ImportResult,
} from "./types";
import { parseQBDate, parseAmount, getMappedValue } from "./parse-utils";

interface RevenueInsert {
  import_run_id: string;
  client_name_raw: string;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: number;
  payment_status: string | null;
}

interface ExpenseInsert {
  import_run_id: string;
  expense_date: string | null;
  category: string | null;
  vendor: string | null;
  amount: number;
  description: string | null;
}

function shouldSkipRow(
  row: Record<string, string>,
  mappings: ColumnMapping[]
): string | null {
  const dateVal = getMappedValue(row, "transaction_date", mappings);
  if (!dateVal.trim() || dateVal.toLowerCase() === "transaction date") {
    return "header row";
  }

  const nameVal = getMappedValue(row, "client_name_raw", mappings);
  if (nameVal.startsWith("Total")) return "summary row";

  const amountVal = getMappedValue(row, "amount", mappings);
  const parsed = parseAmount(amountVal);
  if (parsed === null || parsed === 0) return "empty or zero amount";

  if (!nameVal.trim()) return "missing client name";

  return null;
}

function derivePaymentStatus(
  amountRaw: string,
  balanceRaw: string
): string | null {
  const amount = parseAmount(amountRaw);
  const balance = parseAmount(balanceRaw);
  if (amount === null) return null;
  if (balance === null || balance === 0) return "paid";
  if (Math.abs(balance) >= Math.abs(amount)) return "unpaid";
  return "partial";
}

async function batchInsert(
  table: "qb_revenue" | "qb_expenses",
  rows: Record<string, unknown>[]
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from(table).insert(batch as never);
    if (error) {
      errors.push(`Batch ${Math.floor(i / 100) + 1}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

export async function runImport(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  fileName: string
): Promise<ImportResult> {
  // Create import run
  const { data: importRun, error: runError } = await supabase
    .from("import_runs")
    .insert({
      source: "quickbooks",
      file_name: fileName,
      imported_by: "gregor",
      status: "in_progress",
    })
    .select("id")
    .single();

  if (runError || !importRun) {
    throw new Error(`Failed to create import run: ${runError?.message ?? "Unknown error"}`);
  }

  const runId = importRun.id;
  const revenueRows: RevenueInsert[] = [];
  const expenseRows: ExpenseInsert[] = [];
  let skippedRows = 0;
  const skipReasons: Record<string, number> = {};
  const allErrors: string[] = [];

  for (const row of rows) {
    const skipReason = shouldSkipRow(row, mappings);
    if (skipReason) {
      skippedRows++;
      skipReasons[skipReason] = (skipReasons[skipReason] ?? 0) + 1;
      continue;
    }

    const txnType = getMappedValue(row, "transaction_type", mappings).trim();
    const amountRaw = getMappedValue(row, "amount", mappings);
    const parsedAmount = parseAmount(amountRaw);

    if (parsedAmount === null) continue;

    const isRevenue = REVENUE_TYPES.some(
      (t) => t.toLowerCase() === txnType.toLowerCase()
    );
    const isExpense = EXPENSE_TYPES.some(
      (t) => t.toLowerCase() === txnType.toLowerCase()
    );

    if (isRevenue) {
      const isCreditMemo = txnType.toLowerCase() === "credit memo";
      const amount = isCreditMemo ? -Math.abs(parsedAmount) : parsedAmount;
      const balanceRaw = getMappedValue(row, "balance", mappings);

      revenueRows.push({
        import_run_id: runId,
        client_name_raw: getMappedValue(row, "client_name_raw", mappings).trim(),
        invoice_number: getMappedValue(row, "invoice_number", mappings).trim() || null,
        invoice_date: parseQBDate(getMappedValue(row, "transaction_date", mappings)),
        amount,
        payment_status: derivePaymentStatus(amountRaw, balanceRaw),
      });
    } else if (isExpense) {
      expenseRows.push({
        import_run_id: runId,
        expense_date: parseQBDate(getMappedValue(row, "transaction_date", mappings)),
        category: getMappedValue(row, "account", mappings).trim() || null,
        vendor: getMappedValue(row, "client_name_raw", mappings).trim() || null,
        amount: Math.abs(parsedAmount),
        description: getMappedValue(row, "memo", mappings).trim() || null,
      });
    } else {
      skippedRows++;
      skipReasons["unrecognised transaction type"] =
        (skipReasons["unrecognised transaction type"] ?? 0) + 1;
    }
  }

  // Batch insert
  const revResult = await batchInsert("qb_revenue", revenueRows);
  const expResult = await batchInsert("qb_expenses", expenseRows);

  allErrors.push(...revResult.errors, ...expResult.errors);

  // Update import run
  const totalInserted = revResult.inserted + expResult.inserted;
  const status = allErrors.length > 0 ? "partial" : "success";

  await supabase
    .from("import_runs")
    .update({
      status,
      row_count: totalInserted,
      errors: allErrors.length > 0 ? allErrors : null,
    })
    .eq("id", runId);

  const skipReasonsFormatted = Object.entries(skipReasons).map(
    ([reason, count]) => `${count} rows: ${reason}`
  );

  return {
    revenueRows: revResult.inserted,
    expenseRows: expResult.inserted,
    skippedRows,
    skipReasons: [...skipReasonsFormatted, ...allErrors],
  };
}
