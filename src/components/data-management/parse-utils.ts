import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  COLUMN_ALIASES,
  FIELD_LABELS,
  REQUIRED_FIELDS,
  REVENUE_TYPES,
  EXPENSE_TYPES,
  type ColumnMapping,
  type ImportType,
  type ParsedFile,
} from "./types";

function normalise(s: string): string {
  return s.trim().toLowerCase();
}

function sanitizeHeaders(raw: string[]): string[] {
  const seen = new Set<string>();
  return raw.map((h, i) => {
    let name = h.trim() === "" ? `col_${i}` : h.trim();
    // Deduplicate: if we've already seen this header, append the index
    if (seen.has(name)) {
      name = `${name}_${i}`;
    }
    seen.add(name);
    return name;
  });
}

function autoDetectMappings(headers: string[]): ColumnMapping[] {
  const normHeaders = headers.map(normalise);

  return Object.entries(COLUMN_ALIASES).map(([field, aliases]) => {
    const matchIndex = normHeaders.findIndex((h) =>
      aliases.some((a) => a === h)
    );
    const mappedColumn = matchIndex >= 0 ? headers[matchIndex] : null;

    return {
      dashboardField: field,
      label: FIELD_LABELS[field] ?? field,
      mappedColumn,
      autoDetected: mappedColumn !== null,
      required: REQUIRED_FIELDS.includes(field),
    };
  });
}

function detectImportType(
  rows: Record<string, string>[],
  typeColumn: string | null
): { importType: ImportType; revenueCount: number; expenseCount: number } {
  if (!typeColumn) return { importType: "unknown", revenueCount: 0, expenseCount: 0 };

  let revenueCount = 0;
  let expenseCount = 0;

  for (const row of rows) {
    const val = (row[typeColumn] ?? "").trim();
    if (REVENUE_TYPES.some((t) => t.toLowerCase() === val.toLowerCase())) revenueCount++;
    if (EXPENSE_TYPES.some((t) => t.toLowerCase() === val.toLowerCase())) expenseCount++;
  }

  let importType: ImportType = "unknown";
  if (revenueCount > 0 && expenseCount > 0) importType = "mixed";
  else if (revenueCount > 0) importType = "revenue";
  else if (expenseCount > 0) importType = "expense";

  return { importType, revenueCount, expenseCount };
}

// Known QuickBooks header keywords — if a row contains 3+ of these, it's the real header row
const QB_HEADER_KEYWORDS = [
  "date", "type", "num", "name", "class", "memo", "memo/description",
  "description", "split", "amount", "balance", "account",
  "customer", "transaction date", "transaction type",
  "item split account", "debit", "credit",
];

function looksLikeHeaderRow(cells: string[]): boolean {
  const normed = cells.map((c) => c.trim().toLowerCase());
  const matches = normed.filter((c) => QB_HEADER_KEYWORDS.includes(c));
  return matches.length >= 3;
}

function parseCSVContent(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // First pass: parse without headers to find the real header row
  const raw = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
  });
  const allRows = raw.data;

  // Find the header row (first row with 3+ known QB column names)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(allRows.length, 15); i++) {
    if (looksLikeHeaderRow(allRows[i])) {
      headerIndex = i;
      break;
    }
  }

  // Re-parse from the header row onward
  const dataLines = text.split(/\r?\n/);
  const trimmedText = dataLines.slice(headerIndex).join("\n");

  const result = Papa.parse<Record<string, string>>(trimmedText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  const rawHeaders = result.meta.fields ?? [];
  const headers = sanitizeHeaders(rawHeaders);

  // Re-key rows if any headers were renamed
  const rows = result.data.map((row) => {
    const out: Record<string, string> = {};
    rawHeaders.forEach((rawH, i) => {
      out[headers[i]] = row[rawH] ?? "";
    });
    return out;
  });

  return { headers, rows };
}

function parseXLSXContent(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // First pass: read as array-of-arrays to detect preamble rows
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (allRows.length === 0) return { headers: [], rows: [] };

  // Find the real header row (first row with 3+ known QB column names)
  let headerIndex = 0;
  for (let i = 0; i < Math.min(allRows.length, 15); i++) {
    const cells = (allRows[i] as unknown[]).map((c) => String(c ?? ""));
    if (looksLikeHeaderRow(cells)) {
      headerIndex = i;
      break;
    }
  }

  // Extract headers from the detected row
  const headerCells = (allRows[headerIndex] as unknown[]).map((c) => String(c ?? "").trim());
  const rawHeaders = sanitizeHeaders(headerCells);

  // Data rows start after the header
  const dataSlice = allRows.slice(headerIndex + 1);
  const rows = dataSlice.map((row) => {
    const cells = row as unknown[];
    const strRow: Record<string, string> = {};
    rawHeaders.forEach((h, i) => {
      strRow[h] = String(cells[i] ?? "");
    });
    return strRow;
  });

  return { headers: rawHeaders, rows };
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

  let headers: string[];
  let rows: Record<string, string>[];

  if (isXLSX) {
    const buffer = await file.arrayBuffer();
    const result = parseXLSXContent(buffer);
    headers = result.headers;
    rows = result.rows;
  } else {
    const text = await file.text();
    const result = parseCSVContent(text);
    headers = result.headers;
    rows = result.rows;
  }

  const mappings = autoDetectMappings(headers);
  const typeMapping = mappings.find((m) => m.dashboardField === "transaction_type");
  const { importType, revenueCount, expenseCount } = detectImportType(
    rows,
    typeMapping?.mappedColumn ?? null
  );

  return {
    fileName: file.name,
    fileSize: file.size,
    headers,
    rows,
    mappings,
    importType,
    revenuRowCount: revenueCount,
    expenseRowCount: expenseCount,
  };
}

// Date parsing: handle MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
export function parseQBDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // US format: M/D/YYYY or MM/DD/YYYY
  const parts = s.split("/");
  if (parts.length === 3) {
    const [m, d, y] = parts;
    const month = m.padStart(2, "0");
    const day = d.padStart(2, "0");
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${month}-${day}`;
  }

  return null;
}

// Amount parsing: strip $, commas, handle parentheses as negative
export function parseAmount(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  let s = raw.trim();

  // Handle accounting negative: (1,234.56)
  const isNegative = s.startsWith("(") && s.endsWith(")");
  if (isNegative) s = s.slice(1, -1);

  s = s.replace(/[$,]/g, "");
  const num = parseFloat(s);
  if (isNaN(num)) return null;

  return isNegative ? -num : num;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getMappedValue(
  row: Record<string, string>,
  field: string,
  mappings: ColumnMapping[]
): string {
  const mapping = mappings.find((m) => m.dashboardField === field);
  if (!mapping?.mappedColumn) return "";
  return row[mapping.mappedColumn] ?? "";
}
