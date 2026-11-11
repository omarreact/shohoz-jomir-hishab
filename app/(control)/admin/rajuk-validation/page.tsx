"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardCheck, Database, Download,
  FileJson2, FileText, GitBranch, Layers3, LockKeyhole, MapPinned, Search,
  ShieldAlert, ShieldCheck, Upload, XCircle,
} from "lucide-react";
import {
  ACCEPTANCE_CRITERIA, QA_CHECKS, SOURCE_ISSUES,
  parseSchedule, profileSchedule, toDraftLandBDRecord,
  type FlatRecord, type ReviewEntry, type ReviewIssue, type ReviewStatus,
  type ScheduleData,
} from "@/src/features/rajuk-validation/source";

type Tab = "overview" | "pages" | "records" | "relationships" | "schema" | "import" | "issues" | "qa";
type ExportedReview = {
  format: "landbd-rajuk-review-v1";
  datasetHash: string | null;
  reviews: ReviewEntry[];
  issues: ReviewIssue[];
  criteria: string[];
  qa: string[];
};

const TABS: { id: Tab; title: string; icon: typeof Database }[] = [
  { id: "overview", title: "Overview", icon: Database },
  { id: "pages", title: "Source pages", icon: FileText },
  { id: "records", title: "Records", icon: Search },
  { id: "relationships", title: "Relationships", icon: GitBranch },
  { id: "schema", title: "Schema", icon: FileJson2 },
  { id: "import", title: "Import readiness", icon: ShieldAlert },
  { id: "issues", title: "Issues", icon: AlertTriangle },
  { id: "qa", title: "Acceptance & QA", icon: ClipboardCheck },
];

const CARD = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5";
const FIELD = "min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-offset-2 focus:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const BUTTON = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";
const MUTED = "text-sm leading-relaxed text-slate-600 dark:text-slate-400";
const SOURCE_EXPECTED = { sectors: 28, roads: 1635, plots: 24727, records: 38203, pages: 634, unresolved: 29 };

function downloadJson(filename: string, data: unknown) {
  const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function statusPill(pass: boolean, label: string) {
  return <span className={"inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold " +
    (pass ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
      "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300")}>
    {pass ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}{label}
  </span>;
}

function sourceLabel(row: FlatRecord): string {
  const src = row.record.source;
  return "PDF " + (src?.pdf_page ?? "?") + " · Schedule " + (src?.schedule_page ?? "?") + " · Row " + (src?.table_row ?? "?");
}

export default function RajukValidationPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<ScheduleData | null>(null);
  const [dataFileName, setDataFileName] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(401);
  const [search, setSearch] = useState("");
  const [recordFilter, setRecordFilter] = useState<"all" | "unresolved" | "missing-bangla" | "reviewed">("all");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [mouza, setMouza] = useState("");
  const [dag, setDag] = useState("");
  const [reviews, setReviews] = useState<Record<string, ReviewEntry>>({});
  const [issues, setIssues] = useState<ReviewIssue[]>(SOURCE_ISSUES);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [qa, setQa] = useState<string[]>([]);

  // The PDF and 26 MB JSON are never fetched, transmitted, or written to server storage.
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const profile = useMemo(() => data ? profileSchedule(data) : null, [data]);
  const selectedRecord = useMemo(() => profile?.rows.find((row) => row.recordId === selectedRecordId) ?? null,
    [profile, selectedRecordId]);
  const matchingRows = useMemo(() => {
    if (!profile) return [];
    const q = search.trim().toLocaleLowerCase();
    return profile.rows.filter((row) => {
      if (recordFilter === "unresolved" && !row.unresolved) return false;
      if (recordFilter === "missing-bangla" && row.record.listed_name?.bangla?.trim()) return false;
      if (recordFilter === "reviewed" && !Object.keys(reviews).some((key) => key.startsWith(row.recordId + ":"))) return false;
      if (!q) return true;
      return [row.recordId, row.plotId, row.sector, row.road, row.record.listed_name?.english,
        row.record.listed_name?.bangla, row.record.rs_dag_numbers_source, row.record.mouza_names_source]
        .some((item) => String(item ?? "").toLocaleLowerCase().includes(q));
    });
  }, [profile, recordFilter, reviews, search]);
  const pageRows = useMemo(() => profile?.rows.filter((row) => row.record.source?.pdf_page === pageNumber) ?? [],
    [pageNumber, profile]);
  const mouzaNames = useMemo(() => data ? Object.keys(data.indexes.mouza_to_plot_ids).sort() : [], [data]);
  const dagsForMouza = useMemo(() => data && mouza ? data.indexes.mouza_rs_dag_to_plot_ids[mouza] ?? {} : {},
    [data, mouza]);
  const relatedPlots = useMemo(() => data && mouza ?
    dag ? dagsForMouza[dag] ?? [] : data.indexes.mouza_to_plot_ids[mouza] ?? [] : [],
    [dag, dagsForMouza, data, mouza]);
  const reviewCount = Object.keys(reviews).length;

  async function loadJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setFileError(null);
    if (file.size > 50 * 1024 * 1024) {
      setFileError("JSON exceeds the 50 MB local review limit.");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const verified = parseSchedule(parsed);
      setReviews({});
      setIssues(SOURCE_ISSUES);
      setCriteria([]);
      setQa([]);
      setData(verified);
      setDataFileName(file.name);
      setSelectedRecordId(null);
      setSearch("");
      setRecordFilter("all");
      setMouza("");
      setDag("");
      setTab("overview");
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Unable to read the JSON file.");
    }
  }

  function loadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setFileError("Please select the source PDF."); return;
    }
    setPdfUrl(URL.createObjectURL(file));
    setPdfFileName(file.name);
    setFileError(null);
  }

  function importReview(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    void file.text().then((text) => {
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || !("format" in parsed) ||
          parsed.format !== "landbd-rajuk-review-v1") throw new Error("Unsupported review file.");
      const incoming = parsed as ExportedReview;
      if (data && incoming.datasetHash !== (data.metadata.pdf_sha256 ?? null)) {
        throw new Error("The review belongs to a different source PDF fingerprint.");
      }
      if (!Array.isArray(incoming.reviews) || !Array.isArray(incoming.issues) ||
          !Array.isArray(incoming.criteria) || !Array.isArray(incoming.qa)) {
        throw new Error("Malformed review file.");
      }
      const supported: ReviewStatus[] = ["unreadable", "ambiguous", "manual", "verified"];
      const cleanReviews = incoming.reviews.filter((entry) =>
        entry && typeof entry.key === "string" && supported.includes(entry.status) &&
        typeof entry.note === "string" && typeof entry.updatedAt === "string");
      setReviews(Object.fromEntries(cleanReviews.map((entry) => [entry.key, entry])));
      setIssues(SOURCE_ISSUES.map((issue) => {
        const review = incoming.issues.find((candidate) => candidate.id === issue.id);
        return review && ["open", "investigating", "resolved"].includes(review.status)
          ? { ...issue, status: review.status } : issue;
      }));
      setCriteria(incoming.criteria.filter((item) => ACCEPTANCE_CRITERIA.includes(item as typeof ACCEPTANCE_CRITERIA[number])));
      setQa(incoming.qa.filter((item) => QA_CHECKS.includes(item as typeof QA_CHECKS[number])));
      setFileError(null);
    }).catch((error: unknown) => setFileError(error instanceof Error ? error.message : "Unable to import review."));
  }

  function exportReview() {
    const payload: ExportedReview = {
      format: "landbd-rajuk-review-v1",
      datasetHash: data?.metadata.pdf_sha256 ?? null,
      reviews: Object.values(reviews),
      issues,
      criteria,
      qa,
    };
    downloadJson("rajuk-landbd-review.json", payload);
  }

  function selectRecord(row: FlatRecord, targetTab: Tab = "records") {
    setSelectedRecordId(row.recordId);
    setTab(targetTab);
  }

  function setFieldReview(row: FlatRecord, field: string, status: ReviewStatus, note: string) {
    const key = row.recordId + ":" + field;
    setReviews((previous) => ({ ...previous, [key]: { key, status, note, updatedAt: new Date().toISOString() } }));
  }

  function toggleChecked(item: string, items: string[], setter: (value: string[]) => void) {
    setter(items.includes(item) ? items.filter((entry) => entry !== item) : [...items, item]);
  }

  function fieldControl(row: FlatRecord, field: string, value: unknown) {
    const entry = reviews[row.recordId + ":" + field];
    return (
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800" key={field}>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div><div className="text-xs font-bold uppercase tracking-wide text-slate-500">{field}</div>
            <div className="mt-1 break-words text-sm text-slate-950 dark:text-white">{value === null || value === undefined || value === "" ? <i className="text-amber-600">null / missing</i> : String(value)}</div>
          </div>
          {entry ? statusPill(entry.status === "verified", entry.status) : statusPill(false, "unreviewed")}
        </div>
        <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
          <select className={FIELD} aria-label={"Review " + field} value={entry?.status ?? ""}
            onChange={(e) => setFieldReview(row, field, e.target.value as ReviewStatus, entry?.note ?? "")}>
            <option value="">Not reviewed</option>
            <option value="unreadable">Unreadable</option>
            <option value="ambiguous">Ambiguous</option>
            <option value="manual">Manual verification</option>
            <option value="verified">Verified against PDF</option>
          </select>
          <input className={FIELD} aria-label={"Notes for " + field} placeholder="Review note / source evidence"
            value={entry?.note ?? ""}
            onChange={(e) => setFieldReview(row, field, entry?.status ?? "manual", e.target.value)} />
        </div>
      </div>
    );
  }

  const readinessChecks = [
    ...(profile?.checks ?? []),
    { name: "Region and map sheet mapping", pass: false, detail: "No authoritative mapping supplied" },
    { name: "Cadastral geometry", pass: false, detail: "No GIS parcel geometry in this schedule" },
    { name: "LandBD importer contract", pass: false, detail: "Schema, authorization, idempotency and rollback unverified" },
    { name: "Manual issue resolution", pass: issues.every((issue) => issue.status === "resolved"),
      detail: issues.filter((issue) => issue.status !== "resolved").length + " issues still open/investigating" },
  ];
  const ready = false; // Import and production writes are deliberately out of scope.

  return (
    <section className="mx-auto w-full max-w-[1500px] space-y-5 pb-12">
      <header className="flex flex-col gap-4 rounded-2xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <LockKeyhole size={15} /> Admin · Local evidence only
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">RAJUK → LandBD validation</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Preserve source PDF pages, plot relationships and uncertain fields before considering a LandBD import.
            This page never uploads the PDF or JSON, writes to Firebase, or changes production.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className={BUTTON} onClick={exportReview}><Download size={16}/> Export review</button>
          <label className={BUTTON + " cursor-pointer"}><Upload size={16}/> Import review
            <input className="sr-only" type="file" accept=".json,application/json" onChange={importReview} />
          </label>
        </div>
      </header>

      <div className={CARD + " grid gap-4 lg:grid-cols-2"}>
        <label className="flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 hover:border-emerald-400 dark:border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold"><FileJson2 size={18}/> Load object-oriented JSON</span>
          <span className={MUTED}>{dataFileName ?? "Select rajuk1_full_object_oriented.json (up to 50 MB)"}</span>
          <input type="file" accept=".json,application/json" onChange={loadJson} className="max-w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-white" />
        </label>
        <label className="flex min-w-0 cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 hover:border-emerald-400 dark:border-slate-700">
          <span className="flex items-center gap-2 text-sm font-bold"><FileText size={18}/> Load original PDF locally</span>
          <span className={MUTED}>{pdfFileName ?? "Optional: rajuk1.pdf, opened only in your browser"}</span>
          <input type="file" accept=".pdf,application/pdf" onChange={loadPdf} className="max-w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-white" />
        </label>
        {fileError && <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 lg:col-span-2 dark:bg-rose-950/30 dark:text-rose-200"><XCircle size={18}/>{fileError}</div>}
        <p className="text-xs text-slate-500 lg:col-span-2">Your files stay in this browser tab. Reviews and checklists are in memory only—export a review file before closing or refreshing. Avoid using shared computers for personal land records.</p>
      </div>

      <nav aria-label="RAJUK validation views" className="flex max-w-full gap-2 overflow-x-auto pb-2">
        {TABS.map(({ id, title, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={"inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold " +
              (tab === id ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200")}>
            <Icon size={16}/>{title}
          </button>
        ))}
      </nav>

      {tab === "overview" && <>
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Sectors", profile?.sectors ?? SOURCE_EXPECTED.sectors],
            ["Road groups", profile?.roads ?? SOURCE_EXPECTED.roads],
            ["Unique plots", profile?.plots ?? SOURCE_EXPECTED.plots],
            ["Records", profile?.records ?? SOURCE_EXPECTED.records],
            ["PDF pages", data?.metadata.pdf_page_count ?? SOURCE_EXPECTED.pages],
            ["Unresolved IDs", profile?.unresolved ?? SOURCE_EXPECTED.unresolved],
          ].map(([name, count]) => <article className={CARD} key={String(name)}>
            <div className="text-xs font-semibold text-slate-500">{name}</div>
            <div className="mt-2 text-2xl font-bold tabular-nums">{Number(count).toLocaleString("en-US")}</div>
          </article>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className={CARD}>
            <h2 className="text-lg font-bold">Dataset and source fidelity</h2>
            <p className={"mt-2 " + MUTED}>{data ? "Loaded locally: " + data.metadata.title :
              "Reference figures from previously validated conversion; upload the original JSON to inspect actual records."}</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2"><dt>Structure</dt><dd className="font-mono">sectors → roads → plots → records</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt>Schema version</dt><dd>{data?.metadata.schema_version ?? "2.0.0 (reference)"}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt>Source PDF SHA-256</dt><dd className="max-w-full break-all font-mono text-xs">{data?.metadata.pdf_sha256 ?? "974d7a0883b6fbf7a2567bac6f582576c0cc6667dbf6234748bfe4a0dc4239aa"}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt>Field verification flags</dt><dd>{reviewCount}</dd></div>
              <div className="flex flex-wrap justify-between gap-2"><dt>Source access</dt><dd>{data ? "Browser memory only" : "Not loaded"}</dd></div>
            </dl>
          </article>
          <article className={CARD}>
            <h2 className="text-lg font-bold">Readiness</h2>
            <div className="mt-3">{statusPill(false, "BLOCKED — no imports permitted")}</div>
            <p className={"mt-3 " + MUTED}>Draft region IDs, map-sheet IDs and geometry remain null. This schedule does not prove current legal ownership.</p>
            <div className="mt-4 grid gap-2">
              <button type="button" className={BUTTON} onClick={() => setTab("issues")}><AlertTriangle size={16}/> Review source exceptions</button>
              <button type="button" className={BUTTON} onClick={() => setTab("import")}><ShieldCheck size={16}/> Inspect import checks</button>
            </div>
          </article>
        </div>
      </>}

      {tab === "pages" && <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className={CARD + " space-y-4"}>
          <h2 className="text-lg font-bold">Source page inspector</h2>
          <label className="block text-xs font-semibold">PDF page (1 to {data?.metadata.pdf_page_count ?? 634})
            <input type="number" min={1} max={data?.metadata.pdf_page_count ?? 634} value={pageNumber}
              onChange={(event) => setPageNumber(Math.max(1, Math.min(data?.metadata.pdf_page_count ?? 634, Number(event.target.value) || 1)))}
              className={FIELD + " mt-2"} />
          </label>
          <div className="flex flex-wrap gap-2">
            {[2, 328, 401, 634].map((page) => <button key={page} className={BUTTON} type="button" onClick={() => setPageNumber(page)}>Page {page}</button>)}
          </div>
          <p className={MUTED}>Records on this page: <strong>{data ? pageRows.length : "Load JSON"}</strong>. Schedule page and table-row references are shown below.</p>
          {pageNumber === 328 && statusPill(false, "Intentionally blank source page")}
          {pageNumber === 401 && statusPill(false, "Dag / mouza mismatch — row 46")}
          {pdfUrl ? <a href={pdfUrl + "#page=" + pageNumber} target="_blank" rel="noreferrer" className={BUTTON}>Open PDF page <ArrowUpRight size={16}/></a> :
            <p className="text-sm text-amber-700 dark:text-amber-300">Select rajuk1.pdf above to inspect the original document.</p>}
        </div>
        <div className={CARD + " min-w-0 space-y-3"}>
          <h2 className="text-lg font-bold">Page {pageNumber} · PDF versus extracted records</h2>
          {pdfUrl && <iframe title={"Source PDF page " + pageNumber} src={pdfUrl + "#page=" + pageNumber}
            className="h-[420px] w-full rounded-xl border border-slate-200 dark:border-slate-800 sm:h-[560px]"/>}
          <div className="max-h-[520px] space-y-2 overflow-y-auto">
            {pageRows.slice(0, 100).map((row) => <button key={row.recordId} type="button"
              className="block w-full rounded-xl border border-slate-200 p-3 text-left text-sm hover:border-emerald-500 dark:border-slate-800"
              onClick={() => selectRecord(row)}>
              <div className="font-semibold">{row.plotId ?? "Unresolved plot"} · {row.recordId}</div>
              <div className="text-xs text-slate-500">{sourceLabel(row)}</div>
              <div className="mt-1 break-words">{row.record.listed_name?.english ?? "Name unreadable / missing"}</div>
            </button>)}
            {data && pageRows.length === 0 && <p className={MUTED}>No extracted source rows on this PDF page. Check the PDF itself before classifying the page.</p>}
            {pageRows.length > 100 && <p className={MUTED}>Showing the first 100 of {pageRows.length} page records.</p>}
          </div>
        </div>
      </div>}

      {tab === "records" && <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <article className={CARD + " min-w-0"}>
          <h2 className="text-lg font-bold">Extracted-record comparison</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_190px]">
            <label><span className="sr-only">Search records</span><input className={FIELD} value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Plot / record ID, name, RS dag or mouza"/></label>
            <select className={FIELD} value={recordFilter} onChange={(event) => setRecordFilter(event.target.value as typeof recordFilter)}>
              <option value="all">All records</option><option value="unresolved">Unresolved plot ID</option>
              <option value="missing-bangla">Missing Bangla name</option><option value="reviewed">Flagged / reviewed</option>
            </select>
          </div>
          <p className="my-3 text-xs text-slate-500">{data ? matchingRows.length.toLocaleString("en-US") + " matching rows; showing first 60" : "Load the full JSON to inspect source-linked rows."}</p>
          <div className="max-h-[700px] space-y-2 overflow-auto">
            {matchingRows.slice(0, 60).map((row) => <button type="button" key={row.recordId}
              onClick={() => setSelectedRecordId(row.recordId)}
              className={"w-full rounded-xl border p-3 text-left text-sm " +
                (selectedRecordId === row.recordId ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" :
                  "border-slate-200 hover:border-emerald-400 dark:border-slate-800")}>
              <div className="flex flex-wrap justify-between gap-2 font-semibold"><span>{row.plotId ?? "Unresolved plot"}</span><span className="font-mono text-xs">{row.recordId}</span></div>
              <p className="mt-1 break-words">{row.record.listed_name?.english || "(English name missing)"}</p>
              <p className="mt-1 text-xs text-slate-500">{sourceLabel(row)}</p>
            </button>)}
          </div>
        </article>
        <article className={CARD + " min-w-0"}>
          <h2 className="text-lg font-bold">Record details & field verification</h2>
          {!selectedRecord ? <p className={"mt-3 " + MUTED}>Select a row to review its provenance and mark ambiguous, unreadable or verified fields.</p> : <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <strong className="font-mono text-sm">{selectedRecord.plotId ?? "Unresolved plot"}</strong>
              {statusPill(!selectedRecord.unresolved, selectedRecord.unresolved ? "Missing plot ID" : "Linked plot")}
            </div>
            <p className={"my-3 " + MUTED}>{sourceLabel(selectedRecord)}</p>
            <button className={BUTTON + " mb-3"} type="button"
              onClick={() => { setPageNumber(selectedRecord.record.source?.pdf_page ?? 1); setTab("pages"); }}>Inspect original PDF page</button>
            <div className="space-y-2">
              {fieldControl(selectedRecord, "plot_number", selectedRecord.plotNumber)}
              {fieldControl(selectedRecord, "english_name", selectedRecord.record.listed_name?.english)}
              {fieldControl(selectedRecord, "bangla_name", selectedRecord.record.listed_name?.bangla)}
              {fieldControl(selectedRecord, "deed_number", selectedRecord.record.deed_number)}
              {fieldControl(selectedRecord, "land_katha", selectedRecord.record.land_katha)}
              {fieldControl(selectedRecord, "rs_dag_source", selectedRecord.record.rs_dag_numbers_source)}
              {fieldControl(selectedRecord, "mouza_source", selectedRecord.record.mouza_names_source)}
            </div>
            <button className={BUTTON + " mt-3 w-full"} type="button"
              onClick={() => downloadJson("rajuk-draft-" + selectedRecord.recordId + ".json", toDraftLandBDRecord(selectedRecord))}>
              <Download size={15}/> Export draft mapping (not import-ready)
            </button>
          </>}
        </article>
      </div>}

      {tab === "relationships" && <article className={CARD + " space-y-4"}>
        <h2 className="flex items-center gap-2 text-lg font-bold"><Layers3 size={19}/> Region, mouza, RS dag and plots</h2>
        <p className={MUTED}>Source relationship indexes preserve many-to-many links. Sector ≠ geographic region; map-sheet and geometry references are unknown until independently verified.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Mouza name
            <select className={FIELD + " mt-2"} value={mouza} onChange={(event) => { setMouza(event.target.value); setDag(""); }}>
              <option value="">Choose a source mouza</option>{mouzaNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold">RS dag (optional)
            <select className={FIELD + " mt-2"} value={dag} onChange={(event) => setDag(event.target.value)} disabled={!mouza}>
              <option value="">All RS dag links</option>{Object.keys(dagsForMouza).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map((number) =>
                <option key={number} value={number}>{number}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">{statusPill(false, "Region ID: null")}{statusPill(false, "Map-sheet ID: null")}{statusPill(false, "Geometry: null")}</div>
        {mouza && <p className={MUTED}>{relatedPlots.length} referenced plots for {mouza}{dag ? " · RS dag " + dag : ""}. Showing first 80.</p>}
        <div className="grid max-h-[550px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
          {relatedPlots.slice(0, 80).map((plotId) => <button type="button" key={plotId}
            className="rounded-xl border border-slate-200 p-3 text-left text-sm font-semibold hover:border-emerald-400 dark:border-slate-800"
            onClick={() => {
              const match = profile?.rows.find((row) => row.plotId === plotId);
              if (match) selectRecord(match);
            }}>{plotId}</button>)}
        </div>
      </article>}

      {tab === "schema" && <div className="grid gap-4 lg:grid-cols-2">
        <article className={CARD}>
          <h2 className="text-lg font-bold">Source object-oriented JSON</h2>
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">{JSON.stringify({
            metadata: { pdf_sha256: "SHA-256", pdf_page_count: 634, schema_version: "2.0.0" },
            sectors: { sector: { roads: { road: { plots: { plot_id: { records: [{ record_id: "...", source: { pdf_page: 2, schedule_page: 1, table_row: 2 } }] } } } } } },
            indexes: { mouza_to_plot_ids: {}, mouza_rs_dag_to_plot_ids: {} },
            unresolved_records: [],
          }, null, 2)}</pre>
        </article>
        <article className={CARD}>
          <h2 className="text-lg font-bold">Proposed LandBD staging shape</h2>
          <p className={"mt-2 " + MUTED}>Preview only. No live importer contract has been inspected or approved.</p>
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-sky-200">{JSON.stringify(selectedRecord ? toDraftLandBDRecord(selectedRecord) : {
            source: { document: "rajuk1.pdf", recordId: "source record ID", pdfPage: null, schedulePage: null, tableRow: null },
            scheme: "RAJUK_Purbachol_RS_schedule",
            sector: null, road: null, plotId: null, plotNumber: null, listedName: { english: null, bangla: null },
            deedNumber: null, landKatha: null, rsDagReferences: [],
            regionId: null, mapSheetId: null, geometry: null, currentOwnershipVerified: false,
            importStatus: "blocked_manual_validation",
          }, null, 2)}</pre>
          <p className={"mt-3 " + MUTED}>Unknown fields remain null. A RAJUK schedule record is not automatically a cadastral parcel or authoritative ownership record.</p>
        </article>
      </div>}

      {tab === "import" && <article className={CARD + " space-y-4"}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">LandBD import-readiness gate</h2>{statusPill(ready, "Import BLOCKED")}</div>
        <p className={MUTED}>Read-only checks only. Firebase, DLRMS, GIS and production data are untouched. Passing source checks alone is not permission to import.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {readinessChecks.map((check) => <div key={check.name} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-start gap-2">{check.pass ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18}/> :
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18}/>}
              <div><div className="text-sm font-semibold">{check.name}</div><p className="mt-1 text-xs text-slate-500">{data ? check.detail : "Load JSON to evaluate · " + check.detail}</p></div>
            </div>
          </div>)}
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          <strong>No import action is provided.</strong> Approve a separate staging-only adapter after the source corrections, actual LandBD contract, auth, rollback plan and manual QA are verified.
        </div>
      </article>}

      {tab === "issues" && <article className={CARD}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Source and conversion issues</h2>
          <button className={BUTTON} onClick={exportReview} type="button"><Download size={15}/> Export issues & review</button>
        </div>
        <div className="space-y-3">
          {issues.map((issue) => <div key={issue.id} className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-[1fr_190px]">
            <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{issue.id} · {issue.severity}</div>
              <h3 className="font-bold">{issue.title}</h3><p className={"mt-2 " + MUTED}>{issue.detail}</p></div>
            <label className="text-xs font-semibold">Review status
              <select className={FIELD + " mt-2"} value={issue.status}
                onChange={(event) => setIssues((current) => current.map((item) =>
                  item.id === issue.id ? { ...item, status: event.target.value as ReviewIssue["status"] } : item))}>
                <option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Resolved / manually verified</option>
              </select>
            </label>
          </div>)}
        </div>
      </article>}

      {tab === "qa" && <div className="grid gap-4 lg:grid-cols-2">
        {[{ title: "Acceptance criteria", items: [...ACCEPTANCE_CRITERIA], selected: criteria, setter: setCriteria },
          { title: "Repeatable desktop / mobile QA", items: [...QA_CHECKS], selected: qa, setter: setQa }].map((group) =>
          <article className={CARD} key={group.title}>
            <h2 className="text-lg font-bold">{group.title}</h2>
            <p className={"mt-2 " + MUTED}>{group.selected.length} of {group.items.length} manually marked complete. Checks are not auto-certified.</p>
            <div className="mt-4 space-y-3">{group.items.map((item) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-600" checked={group.selected.includes(item)}
                onChange={() => toggleChecked(item, group.selected, group.setter)}/><span>{item}</span>
            </label>)}</div>
          </article>)}
      </div>}

      <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 sm:flex-row sm:justify-between">
        <span className="inline-flex items-center gap-2"><MapPinned size={14}/> RAJUK source schedule — transcription only, not legal ownership proof</span>
        <span className="inline-flex items-center gap-2"><LockKeyhole size={14}/> Admin route · Browser-local review · No write APIs</span>
      </footer>
    </section>
  );
}
