"use client";

import { useMemo, type RefObject } from "react";
import type { FullKhatian } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildFullKhatianDisplayModel } from "../lib/full-khatian-display";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
  pageOrientation: "portrait" | "landscape";
};

function bangla(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function plainArea(value: string | undefined): string {
  if (!value) return "—";
  return bangla(value.replace(/s*একরs*$/u, "").trim());
}

export default function AuthoritativeKhatianDetailsView({
  khatian,
  fullKhatian,
  surveyKey,
  captureRef,
  pageOrientation,
}: Props) {
  const model = useMemo(
    () => buildFullKhatianDisplayModel(khatian, fullKhatian, surveyKey),
    [khatian, fullKhatian, surveyKey],
  );

  const ownerNames = model.owners.map((owner) => owner.name).filter(Boolean);
  const ownerShares = model.owners.map((owner) => owner.share).filter(Boolean);
  const ownerRelations = model.owners.map((owner) => owner.fatherOrHusband).filter(Boolean);
  const dagNumbers = model.dags.map((dag) => dag.dagNo).filter(Boolean);
  const landClasses = model.dags.map((dag) => dag.landClass).filter(Boolean);
  const totalAreas = model.dags.map((dag) => dag.totalArea).filter(Boolean);
  const khatianShares = model.dags.map((dag) => dag.khatianShare).filter(Boolean);
  const shareAreas = model.dags.map((dag) => dag.shareArea || dag.area).filter(Boolean);

  return (
    <div
      ref={captureRef ?? undefined}
      data-khatian-official-pdf="1"
      data-page-orientation={pageOrientation}
      data-print-document="khatian"
      className="khatian-official-root"
      style={{
        color: "#111111",
        background: "#ffffff",
        fontFamily: 'var(--font-nikosh), "Nikosh", "Nirmala UI", serif',
      }}
    >
      <section className="khatian-official-page khatian-official-form-page">
        <header className="khatian-official-heading">
          <p>বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)</p>
          <h1>খতিয়ান নং {bangla(khatian.KHATIAN_NO)}</h1>
          <span />
        </header>

        <div className="khatian-official-location">
          <span>জেলা : <strong>{khatian.DISTRICT_NAME || "—"}</strong></span>
          <span>উপজেলা /সার্কেল : <strong>{khatian.UPAZILA_NAME || "—"}</strong></span>
          <span>মৌজা : <strong>{khatian.MOUZA_NAME || "—"}</strong></span>
          <span>জে.এল নং : <strong>{bangla(khatian.JL_NUMBER || "—")}</strong></span>
        </div>

        <table className="khatian-official-table">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>মালিক, অকৃষি প্রজা বা<br />ইজারাদারের নাম ও ঠিকানা</th>
              <th>অংশ</th>
              <th>মোট ভূমি উন্নয়ন কর</th>
              <th>দাগ নং</th>
              <th>জমির শ্রেণী</th>
              <th>দাগের মোট জমির পরিমাণ<br />(একর)</th>
              <th>দাগের মধ্যে অত্র<br />খতিয়ানের অংশ</th>
              <th>অংশানুযায়ী জমির পরিমাণ<br />(একর)</th>
              <th>দখল/স্বত্ব বিষয়ক বা অন্যান্য<br />বিষয়ে মন্তব্য</th>
            </tr>
            <tr className="khatian-official-column-numbers">
              {["১","২","৩","৪","৫","৬","৭","৮","৯"].map((number) => <th key={number}>{number}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="khatian-official-lines">
                  {(ownerNames.length ? ownerNames : ["—"]).map((name, index) => (
                    <span key={`${name}-${index}`}>{name}</span>
                  ))}
                </div>
                {ownerRelations.length ? (
                  <div className="khatian-official-owner-relations">
                    {ownerRelations.map((relation, index) => <span key={`${relation}-${index}`}>{relation}</span>)}
                  </div>
                ) : null}
              </td>
              <td>
                <div className="khatian-official-lines">
                  {(ownerShares.length ? ownerShares : ["—"]).map((share, index) => (
                    <span key={`${share}-${index}`}>{bangla(share)}</span>
                  ))}
                </div>
              </td>
              <td>—</td>
              <td>
                <div className="khatian-official-lines khatian-official-dags">
                  {(dagNumbers.length ? dagNumbers : ["—"]).map((dag, index) => (
                    <span key={`${dag}-${index}`}>{bangla(dag)}</span>
                  ))}
                </div>
              </td>
              <td>
                <div className="khatian-official-lines">
                  {(landClasses.length ? landClasses : ["—"]).map((landClass, index) => (
                    <span key={`${landClass}-${index}`}>{landClass}</span>
                  ))}
                </div>
              </td>
              <td>
                <div className="khatian-official-lines">
                  {(totalAreas.length ? totalAreas : ["—"]).map((area, index) => (
                    <span key={`${area}-${index}`}>{plainArea(area)}</span>
                  ))}
                </div>
              </td>
              <td>
                <div className="khatian-official-lines">
                  {(khatianShares.length ? khatianShares : ["—"]).map((share, index) => (
                    <span key={`${share}-${index}`}>{bangla(share)}</span>
                  ))}
                </div>
              </td>
              <td>
                <div className="khatian-official-lines">
                  {(shareAreas.length ? shareAreas : [model.totalLand || "—"]).map((area, index) => (
                    <span key={`${area}-${index}`}>{plainArea(area)}</span>
                  ))}
                </div>
              </td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <div className="khatian-official-page-number">1/2</div>
      </section>

      <section className="khatian-official-page khatian-official-note-page">
        <header className="khatian-official-heading">
          <p>বাংলাদেশ ফরম নং ৫৪৬২ (সংশোধিত)</p>
          <h1>খতিয়ান নং {bangla(khatian.KHATIAN_NO)}</h1>
          <span />
        </header>

        <div className="khatian-official-location">
          <span>জেলা : <strong>{khatian.DISTRICT_NAME || "—"}</strong></span>
          <span>উপজেলা /সার্কেল : <strong>{khatian.UPAZILA_NAME || "—"}</strong></span>
          <span>মৌজা : <strong>{khatian.MOUZA_NAME || "—"}</strong></span>
          <span>জে.এল নং : <strong>{bangla(khatian.JL_NUMBER || "—")}</strong></span>
        </div>

        <div className="khatian-official-notes">
          <h2>বিশেষ দ্রষ্টব্য:</h2>
          <ol>
            <li>এই খতিয়ানটি LandBD-এ উপলভ্য DLRMS/সরকারি ভূমি রেকর্ড উৎসের তথ্য সাজিয়ে প্রস্তুত করা হয়েছে। এটি তথ্য দেখার ও তুলনার সহায়ক অনুলিপি; সরকারি প্রত্যয়িত খতিয়ান নয়।</li>
            <li>সরকারি, আইনি, নামজারি, নিবন্ধন বা আদালতের কাজে ব্যবহারের আগে land.gov.bd বা সংশ্লিষ্ট সরকারি কর্তৃপক্ষের মূল/প্রত্যয়িত নথির সঙ্গে তথ্য যাচাই করতে হবে।</li>
            <li>উৎসে অনুপস্থিত মালিক, অভিভাবক, দাগ, শ্রেণী, অংশ বা জমির পরিমাণ LandBD অনুমান করে পূরণ করে না।</li>
            <li>ভূমি বিষয়ক সরকারি সেবা ও তথ্যের জন্য সংশ্লিষ্ট সরকারি পোর্টাল ও ভূমি সেবা হটলাইন ব্যবহার করুন।</li>
          </ol>

          <div className="khatian-official-source-note">
            <strong>তথ্যসূত্র:</strong> DLRMS / সরকারি ভূমি রেকর্ড উৎস<br />
            <strong>সার্ভে:</strong> {model.surveyLabel || "—"}<br />
            <strong>LandBD:</strong> landbd.pincodeit.com
          </div>
        </div>

        <div className="khatian-official-page-number">2/2</div>
      </section>
    </div>
  );
}
