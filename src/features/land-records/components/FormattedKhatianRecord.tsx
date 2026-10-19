"use client";

import { useMemo } from "react";

type RecordRow = { field: string; value: string };
const MAX_FIELDS = 1500;

/**
 * Preserve the provider's original formatted-khatian field names. Do not
 * reinterpret legal record fields or silently discard structured sub-records.
 */
export function flattenFormattedKhatian(record: unknown): { rows: RecordRow[]; truncated: boolean } {
  const rows: RecordRow[] = [];
  let truncated = false;

  function visit(value: unknown, path: string, depth: number): void {
    if (rows.length >= MAX_FIELDS) {
      truncated = true;
      return;
    }
    if (value === null || value === undefined || value === "") return;

    if (depth >= 16) {
      rows.push({ field: path, value: JSON.stringify(value) ?? String(value) });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path} [${index + 1}]`, depth + 1));
      return;
    }
    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        visit(item, path ? `${path} / ${key}` : key, depth + 1);
      });
      return;
    }
    rows.push({ field: path || "মান", value: String(value) });
  }

  visit(record, "", 0);
  return { rows, truncated };
}

export default function FormattedKhatianRecord({ record }: { record: unknown }) {
  const { rows, truncated } = useMemo(() => flattenFormattedKhatian(record), [record]);
  if (!rows.length) return <p className="text-sm">উৎসে কোনো প্রদর্শনযোগ্য formatted field পাওয়া যায়নি।</p>;

  return (
    <div>
      <table className="w-full table-fixed border-collapse text-left text-[14px] leading-6">
        <thead>
          <tr data-pdf-surface="table-head">
            <th className="w-2/5 border border-slate-300 px-3 py-2">উৎস ফিল্ড</th>
            <th className="border border-slate-300 px-3 py-2">রেকর্ডের মান</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td className="break-words border border-slate-300 px-3 py-1.5 font-semibold">{row.field}</td>
              <td className="break-words border border-slate-300 px-3 py-1.5">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {truncated ? (
        <p className="mt-2 text-sm font-semibold text-amber-800">
          এই উৎস রেকর্ডে ১৫০০টির বেশি ফিল্ড আছে। নিরাপদ পেজ সীমার কারণে অতিরিক্ত ফিল্ড দেখানো হয়নি; মূল সরকারি উৎস থেকে সম্পূর্ণ রেকর্ড যাচাই করুন।
        </p>
      ) : null}
    </div>
  );
}
