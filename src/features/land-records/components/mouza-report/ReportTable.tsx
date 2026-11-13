import type { MouzaReportRowSegment } from "../../reports/mouza-porcha-report";

function MultiValueCell({ items, inline = false }: { items: string[]; inline?: boolean }) {
  if (!items.length) return <span className="report-empty">—</span>;
  if (inline) return <span>{items.join(", ")}</span>;
  return (
    <span className="report-cell-list">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="report-cell-item">
          {item}
        </span>
      ))}
    </span>
  );
}

function DagHistoryCell({ history }: { history: MouzaReportRowSegment["history"] }) {
  if (!history.length) return <span className="report-empty">—</span>;
  return (
    <span className="report-history-list">
      {history.map((item, index) => (
        <span key={`${item.previousDag}-${item.currentDag}-${index}`} className="report-history-item">
          <span className="report-history-label">সাবেক</span> {item.previousDag || "—"}
          <span className="report-history-arrow">→</span>
          <span className="report-history-label">হাল</span> {item.currentDag || "—"}
        </span>
      ))}
    </span>
  );
}

function statusLabel(row: MouzaReportRowSegment): string {
  return row.completeness === "complete"
    ? "পূর্ণ"
    : row.completeness === "enriched"
      ? "সম্পূরক"
      : "আংশিক";
}

export default function ReportTable({
  rows,
  showHistory,
  showOwners,
  showGuardians,
  showDags,
  showLandArea,
}: {
  rows: MouzaReportRowSegment[];
  showHistory: boolean;
  showOwners: boolean;
  showGuardians: boolean;
  showDags: boolean;
  showLandArea: boolean;
}) {
  const columns = [
    { key: "khatian", label: "খতিয়ান নং", weight: 12, visible: true },
    { key: "owners", label: "মালিক", weight: 26, visible: showOwners },
    { key: "guardians", label: "পিতা/স্বামী/অভিভাবক", weight: 22, visible: showGuardians },
    { key: "dags", label: "দাগ নং", weight: 28, visible: showDags },
    { key: "history", label: "সাবেক → হাল", weight: 18, visible: showHistory },
    { key: "landArea", label: "মোট জমি (একর)", weight: 12, visible: showLandArea },
  ].filter((column) => column.visible);
  const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);

  return (
    <table className={showHistory ? "report-table report-table-history" : "report-table"}>
      <colgroup>
        {columns.map((column) => (
          <col key={column.key} style={{ width: `${((column.weight / totalWeight) * 100).toFixed(2)}%` }} />
        ))}
      </colgroup>
      <thead>
        <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.segmentKey} data-report-source-id={row.sourceId}>
            {columns.map((column) => {
              if (column.key === "khatian") {
                return (
                  <td key={column.key} className="report-khatian-number">
                    <strong>{row.khatianNo || "—"}</strong>
                    <span
                      className={`report-source-badge report-source-${row.completeness}`}
                      title={row.missingFields.length ? `অসম্পূর্ণ: ${row.missingFields.join(", ")}` : row.provenanceLabel}
                    >
                      {statusLabel(row)}
                    </span>
                  </td>
                );
              }
              if (column.key === "owners") {
                return <td key={column.key}><MultiValueCell items={row.owners} /></td>;
              }
              if (column.key === "guardians") {
                return <td key={column.key}><MultiValueCell items={row.guardians} /></td>;
              }
              if (column.key === "dags") {
                return <td key={column.key} className="report-dag-cell"><MultiValueCell items={row.dags} inline /></td>;
              }
              if (column.key === "history") {
                return <td key={column.key} className="report-dag-cell"><DagHistoryCell history={row.history} /></td>;
              }
              return (
                <td key={column.key} className="report-land-area">
                  {row.totalLandAcre ? row.totalLandAcre : "—"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
