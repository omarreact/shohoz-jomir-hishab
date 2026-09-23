"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import CertificateForm from "./CertificateForm";
import PrintPreview from "./PrintPreview";
import {
  warishSanadSchema,
  type WarishSanadFormValues,
} from "@/src/features/warishsanad/schema";

const DEFAULT_VALUES: WarishSanadFormValues = {
  referenceNo: "DNCC/WS/2026/",
  issueDate: "",
  ward: "",
  zoneId: "",
  zoneName: "",
  deceasedName: "",
  fatherOrHusbandName: "",
  motherName: "",
  deathDate: "",
  address: "",
  applicantName: "",
  officerName: "",
  officerTitle: "",
  councillorName: "",
  councillorTitle: "",
  heirs: [{ name: "", relation: "পুত্র", idNumber: "" }],
};

export default function WarishSanadClient() {
  const form = useForm<WarishSanadFormValues>({
    resolver: zodResolver(warishSanadSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!form.getValues("issueDate")) {
      form.setValue("issueDate", new Date().toISOString().slice(0, 10), {
        shouldDirty: false,
      });
    }
  }, [form]);

  const values = form.watch();
  const handlePrint = form.handleSubmit(() => window.print());

  return (
    <div className="warish-app" data-bangla-ignore="true">
      <header className="warish-toolbar no-print">
        <div>
          <p className="warish-kicker">LandBD · DNCC document workspace</p>
          <h1>ওয়ারিশান সনদপত্র — DNCC v8</h1>
          <p>
            A4 pixel-calibrated preview। বর্তমান Ward/Zone/Authority তথ্য ডেমো ডেটা—
            অফিসিয়াল ইস্যুর আগে authoritative DNCC source সংযুক্ত করুন।
          </p>
        </div>
        <button type="button" className="warish-print-button" onClick={handlePrint}>
          যাচাই করে Print / Save PDF
        </button>
      </header>

      <div className="warish-demo-warning no-print" role="note">
        <strong>SAMPLE / DEVELOPMENT MODE:</strong> এই পেজ কোনো সরকারি সনদ ইস্যু করে না।
        Preview-তে “SAMPLE — অফিসিয়াল নয়” watermark ইচ্ছাকৃতভাবে স্থায়ী রাখা হয়েছে।
      </div>

      <main className="warish-workspace">
        <section className="warish-form-pane no-print" aria-label="সনদ তথ্য ফর্ম">
          <CertificateForm form={form} />
        </section>

        <section className="warish-preview-pane" aria-label="A4 সনদ প্রিভিউ">
          <PrintPreview values={values} />
        </section>
      </main>
    </div>
  );
}
