"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { File, Folder, ChevronLeft, Download, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import type { MouzaMapEntry } from "@/src/features/land-records/types";

export default function MouzaMapViewer() {
  const [parentId, setParentId] = useState("root");
  const [path, setPath] = useState("0:/");
  const [history, setHistory] = useState<string[]>([]);
  const [entries, setEntries] = useState<MouzaMapEntry[]>([]);
  const [selected, setSelected] = useState<MouzaMapEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const browse = async (id: string, nextPath: string, push = true) => {
    setLoading(true); setError(null);
    try { const { data } = await axios.get("/api/mouza-provider/browse", { params: { parentId: id, path: nextPath }, timeout: 10000 }); setEntries(data.entries); setParentId(id); setPath(nextPath); if (push) setHistory((h) => [...h, parentId]); }
    catch (e) { setError(e instanceof Error ? e.message : "ফোল্ডার লোড করা যায়নি"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void browse("root", "0:/", false); }, []);
  const openEntry = (entry: MouzaMapEntry) => entry.isFolder ? void browse(entry.id, `${path}${path.endsWith("/") ? "" : "/"}${entry.name}/`) : setSelected(entry);
  const back = () => { const previous = history.at(-1); if (!previous) return; setHistory((h) => h.slice(0, -1)); void browse(previous, "0:/", false); };

  return <section>
    <HeroBanner badge="মৌজা ম্যাপ" title="মৌজা ম্যাপ ব্রাউজার" description="ফোল্ডার নেভিগেশন, থাম্বনেইল প্রিভিউ এবং PDF ডাউনলোডের জন্য provider-independent viewer." pattern="dots" />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>ফাইল ব্রাউজার</CardTitle><button type="button" onClick={back} disabled={!history.length || loading} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-40"><ChevronLeft size={16}/>পেছনে</button></div><p className="mt-2 text-sm text-slate-500">{path}</p></CardHeader><CardBody>
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/>লোড হচ্ছে…</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.map((entry) => <button key={entry.id} type="button" onClick={() => openEntry(entry)} className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900"><span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950">{entry.isFolder ? <Folder size={20}/> : <File size={20}/>}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{entry.name}</span><span className="block text-xs text-slate-500">{entry.isFolder ? "ফোল্ডার" : entry.mimeType === "application/pdf" ? "PDF" : entry.mimeType}</span></span></button>)}</div>}
      </CardBody></Card>

      {selected && <Card className="mt-6"><CardHeader><CardTitle>{selected.name}</CardTitle></CardHeader><CardBody><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"> <div className="overflow-hidden rounded-xl border bg-slate-50 p-3 dark:bg-slate-950">{selected.thumbnailUrl ? <img src={selected.thumbnailUrl} alt={selected.name} className="mx-auto max-h-[520px] w-auto rounded-lg object-contain" /> : <div className="flex min-h-60 items-center justify-center text-slate-500"><ImageIcon size={28}/></div>}</div><div className="space-y-3"><p className="text-sm text-slate-500">PDF/ম্যাপ ফাইলের প্রিভিউ ও ডাউনলোড।</p>{selected.downloadUrl && <a href={selected.downloadUrl} download className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#006a4e] px-4 py-2.5 text-sm font-semibold text-white"><Download size={16}/>ডাউনলোড</a>}{selected.webViewLink && <a href={selected.webViewLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold"><ExternalLink size={16}/>ব্রাউজারে খুলুন</a>}</div></div></CardBody></Card>}
    </main>
  </section>;
}
