"use client";

import { AlertTriangle, CheckCircle2, RefreshCcw, ShieldAlert } from "lucide-react";
import PageAccessHeader from "./PageAccessHeader";
import PageAccessSummary from "./PageAccessSummary";
import PageAccessControls from "./PageAccessControls";
import PageAccessList from "./PageAccessList";
import PageAccessSaveBar from "./PageAccessSaveBar";
import { usePageAccessManager } from "./usePageAccessManager";

export default function PageAccessAdminClient() {
  const manager = usePageAccessManager();

  if (manager.authChecking || manager.loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-4">
        <div className="text-center">
          <RefreshCcw className="mx-auto h-9 w-9 animate-spin text-[#17663A]" />
          <p className="mt-3 text-sm font-medium text-slate-500">পেজ অনুমতি লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (!manager.allowed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-slate-900">
          <ShieldAlert size={44} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold">অনুমতি নেই</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            পুরো সাইটের পেজ অনুমতি শুধুমাত্র সুপার অ্যাডমিন নিয়ন্ত্রণ করতে পারবেন।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
      <PageAccessHeader updatedAt={manager.updatedAt} updatedBy={manager.updatedBy} />

      <PageAccessSummary
        counts={manager.counts}
        activeFilter={manager.accessFilter}
        onFilterChange={manager.setAccessFilter}
      />

      {manager.error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          <div className="flex-1">
            <strong className="block">কাজটি সম্পন্ন হয়নি</strong>
            <span className="mt-1 block">{manager.error}</span>
          </div>
          <button
            type="button"
            onClick={() => void manager.loadRules()}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold dark:border-red-800"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      ) : null}

      {manager.success ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
          <CheckCircle2 size={19} /> {manager.success}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <PageAccessControls
          searchText={manager.searchText}
          onSearchTextChange={manager.setSearchText}
          category={manager.category}
          onCategoryChange={manager.setCategory}
          accessFilter={manager.accessFilter}
          onAccessFilterChange={manager.setAccessFilter}
          filteredCount={manager.filteredPages.length}
          onBulkChange={manager.bulkChange}
        />
        <PageAccessList
          pages={manager.filteredPages}
          accessRules={manager.accessRules}
          savedRules={manager.savedRules}
          onChange={manager.changeRule}
        />
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs leading-6 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
        <strong className="block text-sm">সিস্টেম সুরক্ষা</strong>
        অ্যাডমিন প্যানেল, লগইন, এপিআই এবং ত্রুটি পেজ ইচ্ছাকৃতভাবে এই তালিকার বাইরে রাখা হয়েছে। তাই কোনো ভুল পেজ সেটিংসের কারণে সুপার অ্যাডমিন নিয়ন্ত্রণ প্যানেল থেকে লক হয়ে যাবেন না।
      </section>

      <PageAccessSaveBar
        dirty={manager.dirty}
        dirtyCount={manager.dirtyCount}
        saving={manager.saving}
        onDiscard={manager.discardChanges}
        onSave={() => void manager.saveRules()}
      />
    </div>
  );
}
