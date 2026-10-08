"use client";

import { useEffect, useMemo, useState } from "react";

type Heir = {
  id: string;
  name: string;
  birthDate: string;
  idNumber: string;
  relation: string;
};

type CertificateData = {
  referenceNo: string;
  issueDate: string;
  ward: string;
  zone: string;
  officeAddress: string;
  deceasedName: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  village: string;
  postOffice: string;
  thana: string;
  district: string;
  summary: string;
  closing: string;
  leftAuthorityName: string;
  leftAuthorityTitle: string;
  rightAuthorityName: string;
  rightAuthorityTitle: string;
  heirs: Heir[];
};

const STORAGE_KEY = "landbd-warish-draft-v2";

const RELATION_OPTIONS = [
  "পুত্র",
  "কন্যা",
  "স্বামী",
  "স্ত্রী",
  "পিতা",
  "মাতা",
  "ভাই",
  "বোন",
  "নাতি",
  "নাতনি",
  "দাদা",
  "দাদি",
  "নানা",
  "নানি",
  "অন্যান্য",
] as const;

const BANGLA_MONTHS: Record<string, string> = {
  জানুয়ারি: "01",
  জানুয়ারি: "01",
  ফেব্রুয়ারি: "02",
  ফেব্রুয়ারি: "02",
  মার্চ: "03",
  এপ্রিল: "04",
  মে: "05",
  জুন: "06",
  জুলাই: "07",
  আগস্ট: "08",
  সেপ্টেম্বর: "09",
  অক্টোবর: "10",
  নভেম্বর: "11",
  ডিসেম্বর: "12",
};

const englishDigits = (value: string) =>
  value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));

const toIsoDate = (value: string) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const normalized = englishDigits(value).trim();
  const match = normalized.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/);
  if (!match) return "";

  const [, day, monthName, year] = match;
  const month = BANGLA_MONTHS[monthName];
  if (!month) return "";

  return `${year}-${month}-${day.padStart(2, "0")}`;
};

const formatBanglaDate = (value: string) => {
  if (!value) return "—";
  const iso = toIsoDate(value);
  if (!iso) return value;

  const [year, month, day] = iso.split("-");
  const monthNames = [
    "", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];
  const monthName = monthNames[Number(month)] || "";
  return `${banglaDigits(day)} ${monthName} ${banglaDigits(year)}`;
};

const DEFAULT_DATA: CertificateData = {
  referenceNo: "৪৬.১০.০০০০.১৮১.৯৯.০০১.২৫-২৪৩",
  issueDate: "০১.০৯.২৫",
  ward: "44",
  zone: "8",
  officeAddress: "ঢাকা-১২১২ / Dhaka-1212",
  deceasedName: "মৃত আয়েশা খাতুন",
  fatherName: "মৃত জাবু ভুঁইয়া",
  motherName: "মৃত খুলেসা বিবি",
  spouseName: "কফিল উদ্দিন ওরফে আমু মিয়া",
  village: "বেতুলী",
  postOffice: "কাঁচকুড়া",
  thana: "উত্তরখান",
  district: "ঢাকা-১২৩০",
  summary:
    "মৃত ব্যক্তির মৃত্যুর পর তাঁর আইনগত ওয়ারিশদের তথ্য আবেদনকারী কর্তৃক প্রদত্ত নথিপত্র অনুযায়ী নিচে উল্লেখ করা হলো।",
  closing:
    "উপর্যুক্ত ব্যক্তিবর্গ ছাড়া অন্য কোনো আইনগত ওয়ারিশ নেই বলে আবেদনকারী কর্তৃক প্রদত্ত তথ্য ও সংশ্লিষ্ট নথিপত্রের ভিত্তিতে এই নমুনা প্রস্তুত করা হয়েছে।",
  leftAuthorityName: "",
  leftAuthorityTitle: "সুপারিশকারী কর্তৃপক্ষ",
  rightAuthorityName: "",
  rightAuthorityTitle: "অনুমোদনকারী কর্তৃপক্ষ",
  heirs: [
    { id: "h1", name: "অযুফা", birthDate: "০৪ মার্চ ১৯৫৬", idNumber: "২৬১৯৬৭৬১৩৩২৪০", relation: "কন্যা" },
    { id: "h2", name: "নাসিমা", birthDate: "০৮ মার্চ ১৯৮০", idNumber: "১৪৬৬৭৬৬৮৭৮", relation: "কন্যা" },
    { id: "h3", name: "তানিয়া আক্তার", birthDate: "২০ মে ১৯৭৯", idNumber: "১৯০০৭০১৩৯৮", relation: "কন্যা" },
    { id: "h4", name: "মৃত নুরুউদিন", birthDate: "২০ ফেব্রুয়ারি ১৯৭৭", idNumber: "১৯৭৭৬৭৩৬৮৭৯০০২৯৮১", relation: "পুত্র" },
  ],
};

const banglaDigits = (value: string | number) =>
  String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)] ?? digit);

const zoneLabel = (zone: string) => banglaDigits(zone.padStart(2, "0"));

const cloneDefaults = (): CertificateData => ({
  ...DEFAULT_DATA,
  heirs: DEFAULT_DATA.heirs.map((heir) => ({ ...heir })),
});

export default function WarishEditor() {
  const [data, setData] = useState<CertificateData>(cloneDefaults);
  const [saved, setSaved] = useState(false);
  const [officialWards, setOfficialWards] = useState<Array<{ id: string; label: string; zoneId: string }>>([]);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [officialStatus, setOfficialStatus] = useState("");
  const [officialMode, setOfficialMode] = useState<"live" | "verified-snapshot" | "">("");
  const [officialSourceUrls, setOfficialSourceUrls] = useState<{ councillors?: string; officers?: string }>({});
  const [officialDetails, setOfficialDetails] = useState<{
    councillor?: {
      name?: string; title?: string; office?: string; email?: string; officePhone?: string;
      mobile?: string; fax?: string; wardSecretaryMobile?: string; electoralArea?: string;
    };
    officer?: {
      name?: string; title?: string; office?: string; email?: string; officePhone?: string;
      intercom?: string; room?: string; mobile?: string; fax?: string;
    };
  }>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CertificateData>;
      setData({
        ...cloneDefaults(),
        ...parsed,
        heirs: Array.isArray(parsed.heirs) && parsed.heirs.length ? parsed.heirs : cloneDefaults().heirs,
      });
    } catch {
      // Ignore invalid local drafts and keep the safe sample.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setOfficialLoading(true);
    fetch("/api/dncc-directory", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json?.ok) throw new Error(json?.error || "DNCC directory unavailable");
        if (cancelled) return;
        setOfficialWards(Array.isArray(json.data?.wards) ? json.data.wards : []);
        setOfficialSourceUrls(json.sourceUrls ?? {});
        setOfficialMode(json.sourceMode ?? "");
        setOfficialStatus(
          json.sourceMode === "live"
            ? `DNCC LIVE ✓ · ${json.data?.wards?.length ?? 0}টি ওয়ার্ড`
            : `DNCC verified snapshot · ${json.data?.wards?.length ?? 0}টি ওয়ার্ড · verified ${json.verifiedAt ?? ""}`
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setOfficialStatus(error instanceof Error ? `DNCC live fetch ব্যর্থ: ${error.message}` : "DNCC live fetch ব্যর্থ");
        }
      })
      .finally(() => {
        if (!cancelled) setOfficialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof CertificateData>(key: K, value: CertificateData[K]) => {
    setSaved(false);
    setData((current) => ({ ...current, [key]: value }));
  };

  const loadOfficialWard = async (ward: string) => {
    if (!ward) return;
    setOfficialLoading(true);
    setOfficialStatus("DNCC থেকে তথ্য লোড হচ্ছে…");
    try {
      const response = await fetch(`/api/dncc-directory?ward=${encodeURIComponent(ward)}`, {
        cache: "no-store",
      });
      const json = await response.json();
      if (!response.ok || !json?.ok) throw new Error(json?.error || "DNCC তথ্য পাওয়া যায়নি");

      const record = json.data ?? {};
      const councillor = record.councillor ?? {};
      const officer = record.officer ?? {};
      setOfficialSourceUrls(json.sourceUrls ?? {});
      setOfficialMode(json.sourceMode ?? "");
      setOfficialDetails({ councillor, officer });

      const recommender = councillor.name
        ? {
            name: councillor.name,
            title: councillor.title
              ? `${councillor.title}, ওয়ার্ড নং ${Number(record.ward || ward)}`
              : `ওয়ার্ড নং ${Number(record.ward || ward)}`,
          }
        : null;

      const authorisingOfficer = officer.name
        ? {
            name: officer.name,
            title: officer.title || `আঞ্চলিক নির্বাহী কর্মকর্তা, অঞ্চল-${Number(record.zoneId || 0)}`,
          }
        : null;

      setData((current) => ({
        ...current,
        ward,
        zone: record.zoneId ? String(Number(record.zoneId)) : current.zone,
        officeAddress: officer.office || current.officeAddress,
        // Recommender and Authorising Officer are distinct roles.
        // Never copy the ZEO into the recommender field just because a councillor is absent.
        leftAuthorityName: recommender?.name ?? "",
        leftAuthorityTitle: recommender?.title ?? "",
        rightAuthorityName: authorisingOfficer?.name ?? "",
        rightAuthorityTitle: authorisingOfficer?.title ?? "",
      }));

      const bits = [
        record.zoneName ? `Zone: ${record.zoneName}` : "",
        councillor.name ? `Recommender candidate: ${councillor.name}` : "Recommender: councillor record নেই",
        officer.name ? `Authorising Officer (ZEO): ${officer.name}` : "Authorising Officer: ZEO record নেই",
      ].filter(Boolean);
      setOfficialStatus(
        bits.length
          ? `${json.sourceMode === "live" ? "DNCC LIVE ✓" : "DNCC verified snapshot"} · ${bits.join(" · ")}`
          : "DNCC source পাওয়া গেছে, তবে এই ওয়ার্ডের পূর্ণ public details নেই।"
      );
    } catch (error) {
      setOfficialStatus(error instanceof Error ? `DNCC live fetch ব্যর্থ: ${error.message}` : "DNCC live fetch ব্যর্থ");
    } finally {
      setOfficialLoading(false);
    }
  };

  useEffect(() => {
    if (!officialWards.length || !data.ward) return;
    void loadOfficialWard(data.ward);
    // Load the current saved/default ward once the official directory is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officialWards.length]);

  const updateWard = (ward: string) => {
    setSaved(false);
    setData((current) => ({ ...current, ward }));
    void loadOfficialWard(ward);
  };

  const updateHeir = (id: string, key: keyof Omit<Heir, "id">, value: string) => {
    setSaved(false);
    setData((current) => ({
      ...current,
      heirs: current.heirs.map((heir) => (heir.id === id ? { ...heir, [key]: value } : heir)),
    }));
  };

  const addHeir = () => {
    setSaved(false);
    setData((current) => ({
      ...current,
      heirs: [
        ...current.heirs,
        {
          id: `h-${Date.now()}`,
          name: "",
          birthDate: "",
          idNumber: "",
          relation: "",
        },
      ].slice(0, 10),
    }));
  };

  const removeHeir = (id: string) => {
    setSaved(false);
    setData((current) => ({
      ...current,
      heirs: current.heirs.length > 1 ? current.heirs.filter((heir) => heir.id !== id) : current.heirs,
    }));
  };

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
  };

  const resetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(cloneDefaults());
    setSaved(false);
  };

  const intro = useMemo(
    () =>
      `এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, ${data.deceasedName}, পিতা— ${data.fatherName}, মাতা— ${data.motherName}, স্বামী/স্ত্রী— ${data.spouseName}; স্থায়ী ঠিকানা— গ্রাম: ${data.village}, ডাকঘর: ${data.postOffice}, থানা: ${data.thana}, জেলা: ${data.district}। তিনি ঢাকা উত্তর সিটি কর্পোরেশনের ${banglaDigits(data.ward)} নং ওয়ার্ডের স্থায়ী বাসিন্দা ছিলেন।`,
    [data],
  );

  const compact = data.heirs.length > 5;

  return (
    <div className="warish-editor-shell">
      <aside className="editor-panel no-print">
        <div className="editor-sticky">
          <div className="editor-heading">
            <div>
              <p className="editor-kicker">LandBD · Public Draft Editor</p>
              <h1>ওয়ারিশ সনদপত্র এডিটর</h1>
            </div>
            <span className="draft-pill">খসড়া</span>
          </div>

          <p className="editor-warning">
            এটি সরকারি সনদ ইস্যু করে না। নিরাপত্তার জন্য প্রিন্টেও <strong>DRAFT / SAMPLE</strong> চিহ্ন থাকবে এবং
            কোনো বাস্তব স্বাক্ষরের ছবি ব্যবহার করা হয় না।
          </p>

          <div className="editor-actions">
            <button type="button" className="primary" onClick={() => window.print()}>প্রিন্ট / PDF</button>
            <button type="button" onClick={saveDraft}>{saved ? "সেভ হয়েছে" : "এই ডিভাইসে সেভ"}</button>
            <button type="button" onClick={resetDraft}>রিসেট</button>
          </div>

          <section className="form-card">
            <h2>সনদ ও অবস্থান <span className={officialMode === "live" ? "live-badge" : "snapshot-badge"}>{officialMode === "live" ? "DNCC LIVE" : "DNCC VERIFIED"}</span></h2>
            <div className="form-grid two">
              <label>
                <span>সূত্র</span>
                <input value={data.referenceNo} onChange={(e) => update("referenceNo", e.target.value)} />
              </label>
              <label>
                <span>তারিখ</span>
                <input value={data.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
              </label>
              <label>
                <span>ওয়ার্ড</span>
                <select value={data.ward} onChange={(e) => updateWard(e.target.value)}>
                  {(officialWards.length
                    ? officialWards.map((item) => ({ value: String(Number(item.id)), label: item.label }))
                    : Array.from({ length: 54 }, (_, index) => ({
                        value: String(index + 1),
                        label: `ওয়ার্ড ${banglaDigits(index + 1)}`,
                      }))
                  ).map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>অঞ্চল</span>
                <input value={data.zone} onChange={(e) => update("zone", e.target.value)} />
              </label>
              <label className="span-two">
                <span>অফিস ঠিকানা</span>
                <input value={data.officeAddress} onChange={(e) => update("officeAddress", e.target.value)} />
              </label>
            </div>
            <div className="official-source-box">
              <div>
                <strong>{officialStatus || "DNCC official directory সংযোগ প্রস্তুত"}</strong>
                <p>
                  ওয়ার্ড বদলালে DNCC-এর official councillor + officer directory থেকে অঞ্চল, কাউন্সিলর,
                  আঞ্চলিক নির্বাহী কর্মকর্তা ও office field যতটা পাওয়া যায় auto-fill হবে।
                </p>
              </div>
              <button type="button" className="official-refresh" disabled={officialLoading} onClick={() => void loadOfficialWard(data.ward)}>
                {officialLoading ? "লোড হচ্ছে…" : "DNCC থেকে রিফ্রেশ"}
              </button>
              {(officialDetails.councillor || officialDetails.officer) ? (
                <div className="official-contact-grid">
                  <div>
                    <span>ওয়ার্ড কাউন্সিলর</span>
                    <strong>{officialDetails.councillor?.name || "—"}</strong>
                    <small>{officialDetails.councillor?.title || "—"}</small>
                    <small>অফিস: {officialDetails.councillor?.office || "প্রকাশিত নেই"}</small>
                    <small>মোবাইল: {officialDetails.councillor?.mobile || "প্রকাশিত নেই"}</small>
                    <small>ই-মেইল: {officialDetails.councillor?.email || "প্রকাশিত নেই"}</small>
                    <small>ওয়ার্ড সচিব: {officialDetails.councillor?.wardSecretaryMobile || "প্রকাশিত নেই"}</small>
                    <small>নির্বাচনী এলাকা: {officialDetails.councillor?.electoralArea || "প্রকাশিত নেই"}</small>
                  </div>
                  <div>
                    <span>আঞ্চলিক নির্বাহী কর্মকর্তা</span>
                    <strong>{officialDetails.officer?.name || "—"}</strong>
                    <small>{officialDetails.officer?.title || "—"}</small>
                    <small>অফিস: {officialDetails.officer?.office || "প্রকাশিত নেই"}</small>
                    <small>মোবাইল: {officialDetails.officer?.mobile || "প্রকাশিত নেই"}</small>
                    <small>ই-মেইল: {officialDetails.officer?.email || "প্রকাশিত নেই"}</small>
                    <small>ফোন: {officialDetails.officer?.officePhone || "প্রকাশিত নেই"}</small>
                    <small>ইন্টারকম: {officialDetails.officer?.intercom || "প্রকাশিত নেই"}</small>
                  </div>
                </div>
              ) : null}
              <div className="official-links">
                {officialSourceUrls.councillors ? <a href={officialSourceUrls.councillors} target="_blank" rel="noreferrer">DNCC councillor directory ↗</a> : null}
                {officialSourceUrls.officers ? <a href={officialSourceUrls.officers} target="_blank" rel="noreferrer">DNCC officer directory ↗</a> : null}
              </div>
            </div>
          </section>

          <section className="form-card">
            <h2>মৃত ব্যক্তির তথ্য <span className="manual-badge">ম্যানুয়াল / আবেদনকারীর নথি</span></h2>
            <div className="form-grid two">
              <label><span>নাম</span><input value={data.deceasedName} onChange={(e) => update("deceasedName", e.target.value)} /></label>
              <label><span>পিতা</span><input value={data.fatherName} onChange={(e) => update("fatherName", e.target.value)} /></label>
              <label><span>মাতা</span><input value={data.motherName} onChange={(e) => update("motherName", e.target.value)} /></label>
              <label><span>স্বামী/স্ত্রী</span><input value={data.spouseName} onChange={(e) => update("spouseName", e.target.value)} /></label>
              <label><span>গ্রাম</span><input value={data.village} onChange={(e) => update("village", e.target.value)} /></label>
              <label><span>ডাকঘর</span><input value={data.postOffice} onChange={(e) => update("postOffice", e.target.value)} /></label>
              <label><span>থানা</span><input value={data.thana} onChange={(e) => update("thana", e.target.value)} /></label>
              <label><span>জেলা</span><input value={data.district} onChange={(e) => update("district", e.target.value)} /></label>
            </div>
          </section>

          <section className="form-card">
            <div className="section-row">
              <h2>ওয়ারিশদের তালিকা <span className="manual-badge">ম্যানুয়াল / আবেদনকারীর নথি</span></h2>
              <button type="button" className="mini-button" onClick={addHeir} disabled={data.heirs.length >= 10}>
                + ওয়ারিশ
              </button>
            </div>
            <div className="heir-editor-list">
              {data.heirs.map((heir, index) => (
                <div className="heir-editor-row" key={heir.id}>
                  <strong>{banglaDigits(index + 1)}</strong>
                  <input
                    aria-label="নাম"
                    placeholder="নাম"
                    value={heir.name}
                    onChange={(e) => updateHeir(heir.id, "name", e.target.value)}
                  />
                  <input
                    aria-label="জন্মতারিখ"
                    title="ক্যালেন্ডার থেকে জন্মতারিখ নির্বাচন করুন"
                    type="date"
                    value={toIsoDate(heir.birthDate)}
                    onChange={(e) => updateHeir(heir.id, "birthDate", e.target.value)}
                  />
                  <input
                    aria-label="এনআইডি বা জন্ম নিবন্ধন"
                    placeholder="এনআইডি/জন্ম নিবন্ধন"
                    value={heir.idNumber}
                    onChange={(e) => updateHeir(heir.id, "idNumber", e.target.value)}
                  />
                  <select
                    aria-label="সম্পর্ক"
                    value={heir.relation}
                    onChange={(e) => updateHeir(heir.id, "relation", e.target.value)}
                  >
                    <option value="">সম্পর্ক নির্বাচন করুন</option>
                    {RELATION_OPTIONS.map((relation) => (
                      <option key={relation} value={relation}>{relation}</option>
                    ))}
                  </select>
                  <button type="button" className="remove-button" onClick={() => removeHeir(heir.id)} disabled={data.heirs.length === 1}>×</button>
                </div>
              ))}
            </div>
          </section>

          <section className="form-card">
            <div className="section-row authority-section-row">
              <h2>বর্ণনা ও কর্তৃপক্ষ</h2>
              <div className="authority-directory-links">
                <a href={officialSourceUrls.councillors || "https://dncc.gov.bd/views/councilors/a"} target="_blank" rel="noreferrer">
                  DNCC councillor directory ↗
                </a>
                <a href={officialSourceUrls.officers || "https://dncc.gov.bd/pages/officers"} target="_blank" rel="noreferrer">
                  DNCC officer directory ↗
                </a>
              </div>
            </div>

            <label className="stacked-label">
              <span>ওয়ারিশ সম্পর্কিত বর্ণনা</span>
              <textarea rows={3} value={data.summary} onChange={(e) => update("summary", e.target.value)} />
            </label>
            <label className="stacked-label">
              <span>শেষ অনুচ্ছেদ</span>
              <textarea rows={3} value={data.closing} onChange={(e) => update("closing", e.target.value)} />
            </label>

            <div className="authority-role-grid">
              <div className="authority-source-card">
                <div className="authority-source-head">
                  <strong>Recommender / সুপারিশকারী</strong>
                  <a
                    href={officialSourceUrls.councillors || "https://dncc.gov.bd/views/councilors/a"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    DNCC councillor directory ↗
                  </a>
                </div>
                <p className="authority-role-note">
                  এই role-টি <strong>Authorising Officer নয়</strong>। Ward councillor পাওয়া গেলে শুধু এই field-এ auto-fill হবে।
                </p>
                {!officialDetails.councillor?.name ? (
                  <p className="authority-fallback-note">
                    এই ওয়ার্ডে DNCC councillor record পাওয়া যায়নি। Recommender field ইচ্ছাকৃতভাবে ফাঁকা রাখা হয়েছে—
                    Zonal Executive Officer-কে এখানে auto-copy করা হবে না। প্রয়োজন হলে যাচাই করে manually লিখুন।
                  </p>
                ) : null}
                <div className="form-grid two authority-fields">
                  <label><span>বাম কর্তৃপক্ষের নাম</span><input value={data.leftAuthorityName} onChange={(e) => update("leftAuthorityName", e.target.value)} /></label>
                  <label><span>বাম পদবি</span><input value={data.leftAuthorityTitle} onChange={(e) => update("leftAuthorityTitle", e.target.value)} /></label>
                </div>
              </div>

              <div className="authority-source-card">
                <div className="authority-source-head">
                  <strong>Authorising Officer / অনুমোদনকারী কর্মকর্তা</strong>
                  <a
                    href={officialSourceUrls.officers || "https://dncc.gov.bd/pages/officers"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    DNCC officer directory ↗
                  </a>
                </div>
                <p className="authority-role-note">
                  এই field-এ নির্বাচিত Zone-এর <strong>Zonal Executive Officer (ZEO)</strong> auto-fill হবে।
                </p>
                {!officialDetails.officer?.name ? (
                  <p className="authority-fallback-note">
                    এই Zone-এর ZEO record পাওয়া যায়নি। Authorising Officer field ফাঁকা রাখা হয়েছে—manual verification প্রয়োজন।
                  </p>
                ) : null}
                <div className="form-grid two authority-fields">
                  <label><span>ডান কর্তৃপক্ষের নাম</span><input value={data.rightAuthorityName} onChange={(e) => update("rightAuthorityName", e.target.value)} /></label>
                  <label><span>ডান পদবি</span><input value={data.rightAuthorityTitle} onChange={(e) => update("rightAuthorityTitle", e.target.value)} /></label>
                </div>
              </div>
            </div>
          </section>

          <p className="privacy-note">
            NID/জন্ম নিবন্ধনের তথ্য সার্ভারে পাঠানো হয় না; “এই ডিভাইসে সেভ” চাপলে শুধু browser localStorage-এ থাকে।
          </p>
        </div>
      </aside>

      <div className="preview-panel">
        <main className="page-a4" aria-label="Editable draft family certificate preview">
          <div className="sample-pad" aria-hidden="true">
            <header className="header">
              <div className="logo-wrap">
                <img className="header-logo" src="/brand/landbd-symbol.svg" alt="" />
              </div>
              <div className="header-copy">
                <div className="header-bn">LANDBD SAMPLE FAMILY CERTIFICATE</div>
                <div className="header-en">Editable Draft Template — Not an Official Government Document</div>
                <div className="header-address">
                  Zone-{String(data.zone).padStart(2, "0")} · Ward-{data.ward} · {data.officeAddress}
                </div>
              </div>
            </header>

            <div className="divider" />

            <div className="ref-date">
              <div className="ref-field">
                <span>Ref:</span>
                <strong>{data.referenceNo}</strong>
              </div>
              <div className="date-field">
                <span>Date:</span>
                <strong>{data.issueDate}</strong>
              </div>
            </div>

            <div className="doc-title"><span>ওয়ারিশান সনদ</span></div>
          </div>

          <div className="draft-watermark" aria-hidden="true">
            <strong>DRAFT / SAMPLE</strong>
            <span>NOT OFFICIAL</span>
          </div>

          <section className="certificate-body">
            <p className="body-paragraph">{intro}</p>
            <p className="body-paragraph">{data.summary}</p>
            <p className="body-paragraph">
              আইনগত ওয়ারিশদের <strong>নাম, জন্মতারিখ, জাতীয় পরিচয়পত্র/জন্ম নিবন্ধন নম্বর এবং সম্পর্ক</strong> নিম্নে উল্লেখ করা হলো:
            </p>

            <table className={`data-table ${compact ? "compact" : ""}`} aria-label="আইনগত ওয়ারিশের তালিকা">
              <colgroup><col /><col /><col /><col /><col /></colgroup>
              <thead>
                <tr>
                  <th>ক্রঃ নং</th>
                  <th>নাম</th>
                  <th>জন্মতারিখ</th>
                  <th>জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন নম্বর</th>
                  <th>সম্পর্ক</th>
                </tr>
              </thead>
              <tbody>
                {data.heirs.map((heir, index) => (
                  <tr key={heir.id}>
                    <td>{banglaDigits(index + 1)}</td>
                    <td>{heir.name || "—"}</td>
                    <td>{formatBanglaDate(heir.birthDate)}</td>
                    <td>{heir.idNumber || "—"}</td>
                    <td>{heir.relation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="body-paragraph">{data.closing}</p>
          </section>

          <div className="signatures-area">
            <div className="signature-block">
              <span className="signature-line" />
              <strong>Recommender — SAMPLE</strong>
              {data.leftAuthorityName ? <span>{data.leftAuthorityName}</span> : null}
              <span>{data.leftAuthorityTitle}</span>
              <small>কোনো বাস্তব স্বাক্ষর সংযুক্ত নয়</small>
            </div>
            <div className="signature-block">
              <span className="signature-line" />
              <strong>Authorising Officer — SAMPLE</strong>
              {data.rightAuthorityName ? <span>{data.rightAuthorityName}</span> : null}
              <span>{data.rightAuthorityTitle}</span>
              <small>কোনো বাস্তব স্বাক্ষর সংযুক্ত নয়</small>
            </div>
          </div>

          <footer className="sample-footer">
            <span>LANDBD · landbd.pincodeit.com</span>
            <strong>NOT AN OFFICIAL GOVERNMENT DOCUMENT</strong>
            <span>FOR DRAFTING / PREVIEW ONLY</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
