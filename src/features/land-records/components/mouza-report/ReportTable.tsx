import type { MouzaReportRowSegment } from "../../reports/mouza-porcha-report";

function MultiValueCell({ items }: { items: string[] }) {
  if (!items.length) return <span className="report-empty">—</span>;
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

export default function ReportTable({
  rows,
  showHistory,
  showOwners,
  showGuardians,
  showDags,
  showLandArea,
  startIndex,
}: {
  rows: MouzaReportRowSegment[];
  showHistory: boolean;
  showOwners: boolean;
  showGuardians: boolean;
  showDags: boolean;
  showLandArea: boolean;
  startIndex: number;
}) {
  const numberLabels = ["১", "২", "৩", "৪", "৫", "৬", "৭"];
  const columns = [
    { key: "serial", label: "ক্রম", weight: 6, visible: true },
    { key: "khatian", label: "খতিয়ান নং", weight: 11, visible: true },
    { key: "owners", label: "মালিকের নাম", weight: 24, visible: showOwners },
    { key: "guardians", label: "অভিভাবক / সম্পর্ক", weight: 20, visible: showGuardians },
    { key: "dags", label: "দাগ নং", weight: 14, visible: showDags },
    { key: "history", label: "দাগ পরিবর্তন (সাবেক → হাল)", weight: 19, visible: showHistory },
    { key: "landArea", label: "জমির পরিমাণ (একর)", weight: 10, visible: showLandArea },
  ].filter((column) => column.visible);
  const totalWeight = columns.reduce((sum, column) => sum + column.weight, 0);

  return (
    <table className={showHistory ? "report-table report-table-history" : "report-table"}>
      <colgroup>
        {columns.map((column) => (
          <col
            key={column.key}
            style={{ width: `${((column.weight / totalWeight) * 100).toFixed(2)}%` }}
          />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column) => <th key={column.key}>{column.label}</th>)}
        </tr>
        <tr className="report-column-numbers">
          {columns.map((column, index) => <th key={column.key}>{numberLabels[index]}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.segmentKey}>
            {columns.map((column) => {
              if (column.key === "serial") {
                return <td key={column.key} className="report-serial-number">{startIndex + index + 1}</td>;
              }
              if (column.key === "khatian") {
                return <td key={column.key} className="report-khatian-number">{row.khatianNo || "—"}</td>;
              }
              if (column.key === "owners") {
                return <td key={column.key}><MultiValueCell items={row.owners} /></td>;
              }
              if (column.key === "guardians") {
                return <td key={column.key}><MultiValueCell items={row.guardians} /></td>;
              }
              if (column.key === "dags") {
                return <td key={column.key} className="report-dag-cell"><MultiValueCell items={row.dags} /></td>;
              }
              if (column.key === "history") {
                return <td key={column.key} className="report-dag-cell"><DagHistoryCell history={row.history} /></td>;
              }
              return (
                <td key={column.key} className="report-land-area">
                  {row.totalLandAcre ? row.totalLandAcre + " একর" : "—"}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

