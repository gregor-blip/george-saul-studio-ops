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

function parseCSVContent(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });
  const rawHeaders = result.meta.fields ?? [];
  const headers = sanitizeHeaders(rawHeaders);

  // Re-key rows if any headers were renamed
  const rows = result.data.map((row) => {
    const out: Record<string, string> = {};
    rawHeaders.forEach((raw, i) => {
      out[headers[i]] = row[raw] ?? "";
    });
    return out;
  });

  return { headers, rows };
}

function parseXLSXContent(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (jsonData.length === 0) return { headers: [], rows: [] };

  const rawHeaders = Object.keys(jsonData[0]);
  const headers = sanitizeHeaders(rawHeaders);
  const rows = jsonData.map((row) => {
    const strRow: Record<string, string> = {};
    rawHeaders.forEach((raw, i) => {
      strRow[headers[i]] = String(row[raw] ?? "");
    });
    return strRow;
  });

  return { headers, rows };
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
