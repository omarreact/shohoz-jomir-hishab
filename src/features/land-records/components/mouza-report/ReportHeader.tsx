export default function CompactHeader({
  mouzaName,
  jlNumber,
  surveyName,
  reportId,
}: {
  mouzaName: string;
  jlNumber: string;
  surveyName: string;
  reportId: string;
}) {
  return (
    <header className="report-repeat-header">
      <div>
        <strong className="report-repeat-title">মৌজা পর্চা রিপোর্ট</strong>
        <small>{mouzaName} · জে.এল {jlNumber || "—"} · {surveyName}</small>
      </div>
      <div className="report-repeat-meta">
        <span>Report ID</span>
        <b className="report-repeat-id">{reportId}</b>
      </div>
    </header>
  );
}

