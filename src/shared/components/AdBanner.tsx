"use client";

import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="w-100 my-4 text-center no-print">
      <span className="text-muted small mb-1 d-block">Advertisement</span>
      <ins
        className="adsbygoogle d-block bg-light rounded border min-vh-100 w-100"
        style={{ minHeight: "90px" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
