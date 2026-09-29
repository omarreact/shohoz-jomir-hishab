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

const WARD_TO_ZONE: Record<number, number> = {
  1: 1, 17: 1,
  2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2,
  18: 3, 19: 3, 20: 3, 21: 3, 22: 3,
  9: 4, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4,
  23: 5, 24: 5, 25: 5, 26: 5, 27: 5, 28: 5, 29: 5, 30: 5,
  31: 5, 32: 5, 33: 5, 34: 5, 35: 5, 36: 5,
  51: 6, 52: 6, 53: 6, 54: 6,
  47: 7, 48: 7, 49: 7, 50: 7,
  44: 8, 45: 8, 46: 8,
  39: 9, 40: 9, 43: 9,
  37: 10, 38: 10, 41: 10, 42: 10,
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

  const update = <K extends keyof CertificateData>(key: K, value: CertificateData[K]) => {
    setSaved(false);
    setData((current) => ({ ...current, [key]: value }));
  };

  const updateWard = (ward: string) => {
    const numericWard = Number(ward);
    const zone = WARD_TO_ZONE[numericWard];
    setSaved(false);
    setData((current) => ({
      ...current,
      ward,
      zone: zone ? String(zone) : current.zone,
    }));
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
            <h2>সনদ ও অবস্থান</h2>
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
                  {Array.from({ length: 54 }, (_, index) => String(index + 1)).map((ward) => (
                    <option key={ward} value={ward}>{banglaDigits(ward)}</option>
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
            <p className="source-note">
              DNCC-এর প্রকাশিত ওয়ার্ড/অঞ্চল তালিকা অনুযায়ী ওয়ার্ড বদলালে অঞ্চল স্বয়ংক্রিয়ভাবে সেট হয়।
              ওয়ার্ড ৪৪ → অঞ্চল ৮।
            </p>
          </section>

          <section className="form-card">
            <h2>মৃত ব্যক্তির তথ্য</h2>
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
              <h2>ওয়ারিশদের তালিকা</h2>
              <button type="button" className="mini-button" onClick={addHeir} disabled={data.heirs.length >= 10}>
                + ওয়ারিশ
              </button>
            </div>
            <div className="heir-editor-list">
              {data.heirs.map((heir, index) => (
                <div className="heir-editor-row" key={heir.id}>
                  <strong>{banglaDigits(index + 1)}</strong>
                  <input aria-label="নাম" placeholder="নাম" value={heir.name} onChange={(e) => updateHeir(heir.id, "name", e.target.value)} />
                  <input aria-label="জন্মতারিখ" placeholder="জন্মতারিখ" value={heir.birthDate} onChange={(e) => updateHeir(heir.id, "birthDate", e.target.value)} />
                  <input aria-label="এনআইডি বা জন্ম নিবন্ধন" placeholder="এনআইডি/জন্ম নিবন্ধন" value={heir.idNumber} onChange={(e) => updateHeir(heir.id, "idNumber", e.target.value)} />
                  <input aria-label="সম্পর্ক" placeholder="সম্পর্ক" value={heir.relation} onChange={(e) => updateHeir(heir.id, "relation", e.target.value)} />
                  <button type="button" className="remove-button" onClick={() => removeHeir(heir.id)} disabled={data.heirs.length === 1}>×</button>
                </div>
              ))}
            </div>
          </section>

          <section className="form-card">
            <h2>বর্ণনা ও কর্তৃপক্ষ</h2>
            <label className="stacked-label">
              <span>ওয়ারিশ সম্পর্কিত বর্ণনা</span>
              <textarea rows={3} value={data.summary} onChange={(e) => update("summary", e.target.value)} />
            </label>
            <label className="stacked-label">
              <span>শেষ অনুচ্ছেদ</span>
              <textarea rows={3} value={data.closing} onChange={(e) => update("closing", e.target.value)} />
            </label>
            <div className="form-grid two">
              <label><span>বাম কর্তৃপক্ষের নাম</span><input value={data.leftAuthorityName} onChange={(e) => update("leftAuthorityName", e.target.value)} /></label>
              <label><span>বাম পদবি</span><input value={data.leftAuthorityTitle} onChange={(e) => update("leftAuthorityTitle", e.target.value)} /></label>
              <label><span>ডান কর্তৃপক্ষের নাম</span><input value={data.rightAuthorityName} onChange={(e) => update("rightAuthorityName", e.target.value)} /></label>
              <label><span>ডান পদবি</span><input value={data.rightAuthorityTitle} onChange={(e) => update("rightAuthorityTitle", e.target.value)} /></label>
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

            <div className="doc-title"><span>FAMILY CERTIFICATE — SAMPLE</span></div>
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
                    <td>{heir.birthDate || "—"}</td>
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
            <span>LANDBD DEMO TEMPLATE</span>
            <strong>NOT AN OFFICIAL GOVERNMENT DOCUMENT</strong>
            <span>FOR DRAFTING / PREVIEW ONLY</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
