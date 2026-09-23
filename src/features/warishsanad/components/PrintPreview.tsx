"use client";

import type { CSSProperties } from "react";
import type { WarishSanadFormValues } from "@/src/features/warishsanad/schema";

type Props = {
  values: WarishSanadFormValues;
};

const BN_DIGITS: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯",
};

function toBanglaDigits(value: string | number) {
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[digit] ?? digit);
}

function display(value?: string) {
  return value?.trim() ? value.trim() : "................................";
}

function fitClass(value?: string) {
  const length = value?.trim().length ?? 0;
  if (length > 48) return "fit-xs";
  if (length > 34) return "fit-sm";
  return "";
}

function formatDate(value?: string) {
  if (!value) return "........................";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${toBanglaDigits(day)}.${toBanglaDigits(month)}.${toBanglaDigits(year)}`;
}

export default function PrintPreview({ values }: Props) {
  const heirCount = Math.max(1, Math.min(6, values.heirs?.length || 1));
  const tableHeaderHeight = 9.77;
  const tableTop = 110.2;
  const tableBottom = tableTop + tableHeaderHeight + heirCount * 9.77;
  const attestationTop = tableBottom + 5.5;
  const signatureTop = Math.max(attestationTop + 31, 220);

  const style = {
    "--v8-attestation-top": `${attestationTop.toFixed(2)}mm`,
    "--v8-signature-top": `${signatureTop.toFixed(2)}mm`,
  } as CSSProperties;

  return (
    <div className="warish-preview-scroll">
      <article className="v8-paper" style={style} aria-label="DNCC v8 A4 certificate preview">
        <div className="v8-watermark" aria-hidden="true">
          <div className="v8-watermark-seal">DNCC</div>
          <strong>SAMPLE</strong>
          <span>অফিসিয়াল নয়</span>
        </div>

        <header className="v8-locked-header">
          <div className="v8-seal" aria-label="DNCC placeholder seal">
            <span>DNCC</span>
            <small>ঢাকা উত্তর</small>
          </div>
          <div className="v8-letterhead">
            <h2>ঢাকা উত্তর সিটি কর্পোরেশন</h2>
            <p>Dhaka North City Corporation</p>
            <p className="v8-office-line">আঞ্চলিক কার্যালয় · {display(values.zoneName)}</p>
            <p className="v8-web">www.dncc.gov.bd</p>
          </div>
        </header>

        <div className="v8-header-rule" />

        <div className="v8-reference-row">
          <span>স্মারক নং: <b>{display(values.referenceNo)}</b></span>
          <span>তারিখ: <b>{formatDate(values.issueDate)}</b></span>
        </div>

        <h1 className="v8-title">ওয়ারিশান সনদপত্র</h1>

        <section className="v8-intro continuous-paragraph">
          এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, মৃত{" "}
          <span className={`v8-inline-field ${fitClass(values.deceasedName)}`}>
            {display(values.deceasedName)}
          </span>
          , পিতা/স্বামী:{" "}
          <span className={`v8-inline-field ${fitClass(values.fatherOrHusbandName)}`}>
            {display(values.fatherOrHusbandName)}
          </span>
          , মাতা:{" "}
          <span className={`v8-inline-field ${fitClass(values.motherName)}`}>
            {display(values.motherName)}
          </span>
          , ঠিকানা:{" "}
          <span className={`v8-inline-field wide ${fitClass(values.address)}`}>
            {display(values.address)}
          </span>
          , ওয়ার্ড নং {values.ward ? toBanglaDigits(values.ward) : "...."}, ঢাকা উত্তর সিটি
          কর্পোরেশন-এর বাসিন্দা ছিলেন।
          {values.deathDate ? <> মৃত্যুর তারিখ {formatDate(values.deathDate)}।</> : null}
        </section>

        <div className="table-block">
          <table className="cert-table">
            <colgroup>
              <col style={{ width: "9.6%" }} />
              <col style={{ width: "33.2%" }} />
              <col style={{ width: "27.7%" }} />
              <col style={{ width: "29.5%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ক্রমিক</th>
                <th>ওয়ারিশের নাম</th>
                <th>সম্পর্ক</th>
                <th>NID / জন্ম নিবন্ধন</th>
              </tr>
            </thead>
            <tbody>
              {(values.heirs?.length ? values.heirs : [{ name: "", relation: "পুত্র", idNumber: "" }]).slice(0, 6).map((heir, index) => (
                <tr key={index}>
                  <td>{toBanglaDigits(index + 1)}</td>
                  <td className={fitClass(heir.name)}>{display(heir.name)}</td>
                  <td>{display(heir.relation)}</td>
                  <td className={fitClass(heir.idNumber)}>{display(heir.idNumber)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="v8-attestation continuous-paragraph">
          স্থানীয়ভাবে প্রাপ্ত তথ্য, আবেদনকারীর ঘোষণা এবং উপস্থাপিত কাগজপত্রের ভিত্তিতে
          উপরোক্ত ব্যক্তিবর্গকে মৃত ব্যক্তির ওয়ারিশ হিসেবে উল্লেখ করা হলো। আবেদনকারীর নাম:{" "}
          <span className={`v8-inline-field ${fitClass(values.applicantName)}`}>
            {display(values.applicantName)}
          </span>
          । এই development template সরকারি যাচাই, অনুমোদন বা ডিজিটাল স্বাক্ষরের বিকল্প নয়।
        </section>

        <section className="v8-signatures">
          <div className="v8-signature-block">
            <div className="v8-sign-line" />
            <strong className={fitClass(values.councillorName)}>{display(values.councillorName)}</strong>
            <span>{display(values.councillorTitle)}</span>
            <span>ঢাকা উত্তর সিটি কর্পোরেশন</span>
          </div>
          <div className="v8-signature-block">
            <div className="v8-sign-line" />
            <strong className={fitClass(values.officerName)}>{display(values.officerName)}</strong>
            <span>{display(values.officerTitle)}</span>
            <span>ঢাকা উত্তর সিটি কর্পোরেশন</span>
          </div>
        </section>

        <footer className="v8-locked-footer">
          <div className="v8-footer-rule"><i /><i /><i /></div>
          <div>
            <span>ঢাকা উত্তর সিটি কর্পোরেশন · নাগরিক সেবা</span>
            <b>SAMPLE — অফিসিয়াল নয়</b>
          </div>
        </footer>
      </article>
    </div>
  );
}
