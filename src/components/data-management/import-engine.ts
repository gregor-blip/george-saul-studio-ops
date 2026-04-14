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
  account_code: string | null;
  account_name: string | null;
}

interface ExpenseInsert {
  import_run_id: string;
  expense_date: string | null;
  category: string | null;
  vendor: string | null;
  amount: number;
  description: string | null;
  client_name_raw: string | null;
  account_code: string | null;
  account_name: string | null;
}

// ---------------------------------------------------------------------------
// Account code classification — derived from G&S Management P&L structure
// ---------------------------------------------------------------------------

// Exact people codes (US wages, payroll, bonuses, benefits, PR taxes, intl)
const PEOPLE_CODES = new Set([
  "6021", "6022", "6023", "6028",
  "6031", "6032", "6033", "6034", "6036", "6037", "6038", "6039",
  "6041", "6042", "6043",
  "6055", "6056",
  "6121", "6122", "6123", "6124", "6125", "6126", "6127", "6128",
  "6129", "6130", "6131", "6132", "6133", "6134",
  "6205", "6206", "6207", "6208", "6209", "6210", "6211",
  "6228", "6250", "6280", "6300", "6350", "6370",
  "6406", "6410", "6412", "6416", "6417",
  "6422", "6424", "6425", "6426", "6427", "6428", "6429",
  "6430", "6431", "6432", "6433", "6434",
  "6450", "6451", "6452",
]);

const SKIP_CODES = new Set(["6060"]);

function getExpenseType(code: string | null): "media_spend" | "production" | "people" | "overhead" | "skip" {
  if (!code) return "overhead";
  if (SKIP_CODES.has(code)) return "skip";

  // 5xxx — COGS / media spend
  if (code.startsWith("5")) {
    if (code === "5200") return "production";
    return "media_spend";
  }

  // 6xxx — operating expenses
  if (code.startsWith("6")) {
    if (PEOPLE_CODES.has(code)) return "people";
    return "overhead";
  }

  return "overhead";
}

function getRevenueType(code: string | null): "media" | "agency" {
  if (code === "4011") return "media";
  return "agency";
}

function shouldSkipExpense(code: string | null, category: string | null): boolean {
  if (code && SKIP_CODES.has(code)) return true;
  if (category && category.toLowerCase().includes("exchange account")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Section header detection
// ---------------------------------------------------------------------------

// Pattern: "4011 Media Orders" or "6021 Daniel Dahlberg Wages"
const ACCOUNT_SECTION_RE = /^(\d{4})\s+(.+)$/;

function isAccountSectionHeader(row: Record<string, string>, headers: string[]): { code: string; name: string } | null {
  if (headers.length === 0) return null;
  const firstVal = (row[headers[0]] ?? "").trim();
  if (!firstVal) return null;

  const match = firstVal.match(ACCOUNT_SECTION_RE);
  if (!match) return null;

  // Verify the rest of the row is empty (section header, not a data row)
  const hasOtherContent = headers.slice(1).some((h) => {
    const v = (row[h] ?? "").trim();
    return v !== "" && v !== "0" && v !== "0.00";
  });
  if (hasOtherContent) return null;

  return { code: match[1], name: match[2] };
}

// ---------------------------------------------------------------------------
// Row validation
// ---------------------------------------------------------------------------

function shouldSkipRow(
  row: Record<string, string>,
  mappings: ColumnMapping[]
): string | null {
  const dateVal = getMappedValue(row, "transaction_date", mappings);
  if (!dateVal.trim() || dateVal.toLowerCase() === "transaction date") {
    return "header row";
  }

  const classVal = getMappedValue(row, "client_class", mappings).trim();
  const nameVal = getMappedValue(row, "client_name_raw", mappings);
  if (nameVal.startsWith("Total") || classVal.startsWith("Total")) return "summary row";

  const amountVal = getMappedValue(row, "amount", mappings);
  const parsed = parseAmount(amountVal);
  if (parsed === null || parsed === 0) return "empty or zero amount";

  if (!nameVal.trim() && !classVal) return "missing client name";

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

// ---------------------------------------------------------------------------
// Batch insert
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main import
// ---------------------------------------------------------------------------

export async function runImport(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  fileName: string,
  headers: string[] = []
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

  // Track current account section as we scan rows
  let currentAccountCode: string | null = null;
  let currentAccountName: string | null = null;

  for (const row of rows) {
    // Check if this row is an account section header (e.g. "4011 Media Orders")
    const sectionHeader = isAccountSectionHeader(row, headers);
    if (sectionHeader) {
      currentAccountCode = sectionHeader.code;
      currentAccountName = sectionHeader.name;
      skippedRows++;
      skipReasons["account section header"] = (skipReasons["account section header"] ?? 0) + 1;
      continue;
    }

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

    // Resolve client name: prefer Class column over Name column
    const classValue = getMappedValue(row, "client_class", mappings).trim();
    const nameValue = getMappedValue(row, "client_name_raw", mappings).trim();
    const clientName = classValue || nameValue;

    if (isRevenue) {
      // Skip revenue rows with non-positive amounts
      if (parsedAmount <= 0 && txnType.toLowerCase() !== "credit memo") {
        skippedRows++;
        skipReasons["non-positive revenue"] = (skipReasons["non-positive revenue"] ?? 0) + 1;
        continue;
      }

      const txnLower = txnType.toLowerCase();
      const isCreditMemo = txnLower === "credit memo";
      const isDeposit = txnLower === "deposit";
      const amount = isCreditMemo ? -Math.abs(parsedAmount) : parsedAmount;
      const balanceRaw = getMappedValue(row, "balance", mappings);

      revenueRows.push({
        import_run_id: runId,
        client_name_raw: clientName,
        invoice_number: getMappedValue(row, "invoice_number", mappings).trim() || null,
        invoice_date: parseQBDate(getMappedValue(row, "transaction_date", mappings)),
        amount,
        payment_status: isDeposit ? "paid" : derivePaymentStatus(amountRaw, balanceRaw),
        account_code: currentAccountCode,
        account_name: currentAccountName,
      });
    } else if (isExpense) {
      const category = getMappedValue(row, "account", mappings).trim() || null;

      // Skip excluded account codes and exchange account rows
      if (shouldSkipExpense(currentAccountCode, category)) {
        skippedRows++;
        skipReasons["excluded account code"] = (skipReasons["excluded account code"] ?? 0) + 1;
        continue;
      }

      // Skip non-positive expense amounts
      if (parsedAmount <= 0) {
        skippedRows++;
        skipReasons["non-positive expense"] = (skipReasons["non-positive expense"] ?? 0) + 1;
        continue;
      }

      expenseRows.push({
        import_run_id: runId,
        expense_date: parseQBDate(getMappedValue(row, "transaction_date", mappings)),
        category,
        vendor: nameValue || null,
        amount: Math.abs(parsedAmount),
        description: getMappedValue(row, "memo", mappings).trim() || null,
        client_name_raw: clientName || null,
        account_code: currentAccountCode,
        account_name: currentAccountName,
      });
    } else {
      skippedRows++;
      skipReasons["unrecognised transaction type"] =
        (skipReasons["unrecognised transaction type"] ?? 0) + 1;
    }
  }

  // Batch insert
  const revResult = await batchInsert("qb_revenue", revenueRows as unknown as Record<string, unknown>[]);
  const expResult = await batchInsert("qb_expenses", expenseRows as unknown as Record<string, unknown>[]);

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
