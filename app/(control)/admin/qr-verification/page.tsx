"use client";

import React from "react";
import KhatianVerificationLookup from "@/src/features/land-records/components/KhatianVerificationLookup";

export default function AdminQrVerificationPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">QR ভেরিফিকেশন</h1>
        <p className="mt-1 text-sm text-slate-500">DLRMS এবং নামজারি (Mutation) খতিয়ানের QR যাচাই করুন।</p>
      </div>
      
      {/* 
        We are reusing the KhatianVerificationLookup component. 
        It has its own styling and logic, so we just wrap it here.
      */}
      <div className="-mx-3 sm:mx-0">
        <KhatianVerificationLookup />
      </div>
    </div>
  );
}
