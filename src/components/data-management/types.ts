export interface ColumnMapping {
  dashboardField: string;
  label: string;
  mappedColumn: string | null;
  autoDetected: boolean;
  required: boolean;
}

export type ImportType = "revenue" | "expense" | "mixed" | "unknown";

export interface ParsedFile {
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: Record<string, string>[];
  mappings: ColumnMapping[];
  importType: ImportType;
  revenuRowCount: number;
  expenseRowCount: number;
}

export interface ImportResult {
  revenueRows: number;
  expenseRows: number;
  skippedRows: number;
  skipReasons: string[];
}

export type ImportState =
  | { phase: "upload" }
  | { phase: "preview"; file: ParsedFile }
  | { phase: "importing"; file: ParsedFile; totalRows: number }
  | { phase: "complete"; result: ImportResult };

// QB column name aliases for auto-detection
export const COLUMN_ALIASES: Record<string, string[]> = {
  transaction_date: ["transaction date", "date", "txn date"],
  transaction_type: ["transaction type", "type"],
  invoice_number: ["num", "invoice #", "number"],
  client_name_raw: ["name", "customer", "customer:job"],
  memo: ["memo/description", "memo", "description"],
  account: ["item split account", "account", "split"],
  amount: ["amount", "debit"],
  balance: ["balance"],
};

export const FIELD_LABELS: Record<string, string> = {
  transaction_date: "Transaction Date",
  transaction_type: "Transaction Type",
  invoice_number: "Invoice Number",
  client_name_raw: "Client Name",
  memo: "Memo / Description",
  account: "Account",
  amount: "Amount",
  balance: "Balance",
};

export const REQUIRED_FIELDS = [
  "transaction_date",
  "transaction_type",
  "client_name_raw",
  "amount",
];

export const REVENUE_TYPES = ["Invoice", "Credit Memo"];
export const EXPENSE_TYPES = ["Expense", "Check", "Bill", "Bill Payment", "Journal Entry"];
