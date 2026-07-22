"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { resolveApiRequestUrl } from "@/lib/api/rajukTiles";
import {
  Database,
  Users,
  Globe,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Terminal,
  Link2,
  PlayCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface ApiRow {
  name: string;
  endpoint: string;
  type: "Rajuk" | "Firebase" | "External";
  status: "active" | "unknown";
  note: string;
}

interface DataRow {
  label: string;
  value: string | number;
  category: "users" | "content" | "config";
  icon: React.ReactNode;
}

const MS_MAUZA_TOKEN =
  "a8G2bN9mqFsECE9ZUgn_Wj3vZ_onrRdJ9Uck8dMWUELQmzyydmv8pKkPeUA1Gez5_2eX-QZkJzhnnFSFbukM3qEq-7iBKPIZecCLlyQAPybJAr4AeWz5RvuTXRM_DVwlel3ojOLGRq9ApEm-dgCsfPeUcVz9COSLi4qoR0Dch9FQItydXvjBW760CddqCWZKQbF2OCe1_pCA2IgTZbspb1nbg9GNN-Xps6y__xJ2_r07AHU8jU5YF8acmqXR4M0Y0xFHPYFxk1TyeGtW9m2c-cBYSm5Gvh88otoEIVzIbVKfnPbVPQxL-d7AalqJbNZA9E3vbaXfhrZ-7-WNywio_A..";

export const API_REGISTRY: ApiRow[] = [
  {
    name: "Landbd Proxy",
    endpoint: "/api/landbd",
    type: "External",
    status: "active",
    note: "Local + production proxy for landbd.pincodeit.com",
  },
  {
    name: "RS Plots (FeatureServer/0)",
    endpoint: "/api/unified?include=plots&limit=1",
    type: "Rajuk",
    status: "active",
    note: "RS Plot geometry + attributes",
  },
  {
    name: "MS Plots (FeatureServer/2)",
    endpoint: "/api/unified?include=msPlots&limit=1",
    type: "Rajuk",
    status: "active",
    note: "MS Plot attributes (no geometry)",
  },
  {
    name: "DAP Landuse (MapServer/0)",
    endpoint: "/api/unified?include=landuse&limit=1",
    type: "Rajuk",
    status: "active",
    note: "Landuse zone intersection",
  },
  {
    name: "Flood Overlay (MapServer/0)",
    endpoint: "/api/unified?include=flood&limit=1",
    type: "Rajuk",
    status: "active",
    note: "Flood risk zone intersection",
  },
  {
    name: "MS Mauza Tiles (Proxy)",
    endpoint: "Hosted/MS_Mauza_Tiles_Final",
    type: "Rajuk",
    status: "active",
    note: "MS survey raster tiles (Info)",
  },
  {
    name: "RS Mauza Tiles",
    endpoint: "Hosted/RS_Mauza_Tiles_Final",
    type: "Rajuk",
    status: "active",
    note: "RS survey raster tiles",
  },
  {
    name: "RS Mauza 282 Scale",
    endpoint: "Hosted/RS_Mauza_282Scale",
    type: "Rajuk",
    status: "active",
    note: "High-res RS tiles (zoom 17+)",
  },
  {
    name: "DAP Landuse Tiles",
    endpoint: "Hosted/DAP_proposed_landuse",
    type: "Rajuk",
    status: "active",
    note: "Raster landuse layer",
  },
  {
    name: "Overlay Boundary Tiles",
    endpoint: "Hosted/Overlay_Boundary_Tiles",
    type: "Rajuk",
    status: "active",
    note: "Rajuk administrative boundary",
  },
  {
    name: "Rajuk Zone Subzone Tiles",
    endpoint: "Hosted/Rajuk_Zone_Subzone_Tiles",
    type: "Rajuk",
    status: "active",
    note: "DAP zone & subzone layer",
  },
  {
    name: "Transport Network Tiles",
    endpoint: "Hosted/Transport_Network_Tiles",
    type: "Rajuk",
    status: "active",
    note: "Proposed road network",
  },
  {
    name: "Flood Overlay Tiles",
    endpoint: "Hosted/flood_overlay_lvl11_20",
    type: "Rajuk",
    status: "active",
    note: "Visual flood zone overlay",
  },
  {
    name: "Landmarks Tiles",
    endpoint: "Hosted/Major_Landmarks_V2_TILES",
    type: "Rajuk",
    status: "active",
    note: "Major landmarks",
  },
  {
    name: "POI Proposed Tiles",
    endpoint: "Hosted/POI_Proposed_Tiles",
    type: "Rajuk",
    status: "active",
    note: "Proposed points of interest",
  },
  {
    name: "Rajuk Token",
    endpoint: "/api/rajuk-token",
    type: "Firebase",
    status: "active",
    note: "Token from Firebase config/rajuk_api",
  },
  {
    name: "Open-Meteo Elevation",
    endpoint:
      "https://api.open-meteo.com/v1/elevation?latitude=23.8103&longitude=90.4125",
    type: "External",
    status: "active",
    note: "Ground elevation at lat/lng",
  },
  {
    name: "Porcha JSON",
    endpoint: "/api/porcha",
    type: "Firebase",
    status: "active",
    note: "Porcha data served as static JSON",
  },
];

const PAGE_SIZE = 8;

export default function DataMonitorPage() {
  const [firebaseData, setFirebaseData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedApis, setSelectedApis] = useState<number[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string>("");

  const handleCheckboxChange = (index: number) => {
    setSelectedApis((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index],
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Link copied to clipboard!");
  };

  const selectAll = () =>
    setSelectedApis(API_REGISTRY.map((_, index) => index));
  const unselectAll = () => setSelectedApis([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const rows: DataRow[] = [];
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();

        rows.push({
          label: "মোট ব্লগ পোস্ট",
          value: data.blogCount ?? 0,
          category: "content",
          icon: <Globe size={16} />,
        });
        rows.push({
          label: "কাস্টম পেজ",
          value: data.pageCount ?? 0,
          category: "content",
          icon: <Database size={16} />,
        });
        rows.push({
          label: "নিবন্ধিত ব্যবহারকারী",
          value: data.userCount ?? 0,
          category: "users",
          icon: <Users size={16} />,
        });
        rows.push({
          label: "রাজউক টোকেন কনফিগ",
          value: data.rajukTokenSet ? "✓ সেট আছে" : "✗ নেই",
          category: "config",
          icon: <CheckCircle2 size={16} />,
        });
        rows.push({
          label: "মেইনটেন্যান্স মোড",
          value: data.maintenanceMode ? "চালু" : "বন্ধ",
          category: "config",
          icon: <AlertTriangle size={16} />,
        });
        if (data.announcement) {
          rows.push({
            label: "ঘোষণা (Announcement)",
            value: data.announcement,
            category: "config",
            icon: <Activity size={16} />,
          });
        }
      } catch (error) {
        console.error("Data Monitor fetch error:", error);
      }
      setFirebaseData(rows);
      setLoading(false);
    };

    fetchStats();
  }, [refreshKey]);

  const filteredApis = API_REGISTRY.filter(
    (row) => typeFilter === "all" || row.type === typeFilter,
  )
    .filter(
      (row) =>
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.endpoint.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );

  const totalPages = Math.ceil(filteredApis.length / PAGE_SIZE);
  const pageSlice = filteredApis.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const activeApis = API_REGISTRY.filter(
    (row) => row.status === "active",
  ).length;

  return (
    <div className="fade-in visible" data-admin-panel="true">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">ডেটা মনিটর</h1>
          <p className="text-[var(--text-secondary)]">API, Firebase এবং কনফিগারেশন সবকিছু এক জায়গায় দেখুন এবং পরিচালনা করুন।</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setRefreshKey((value) => value + 1)}
            className="px-6 py-2.5 rounded-full font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors flex items-center"
          >
            <RefreshCw size={18} className="mr-2" /> রিফ্রেশ
          </button>
          <Link
            href="/admin/data-monitor/result"
            className="text-decoration-none"
          >
            <button className="px-6 py-2.5 rounded-full font-bold bg-[var(--text-primary)] text-[var(--bg)] hover:scale-105 transition-transform shadow-md">
              রেজাল্ট পেজ
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-blue-500 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between">
          <div className="text-sm font-medium opacity-80 mb-2">সক্রিয় API</div>
          <div className="text-4xl font-bold">{activeApis}</div>
        </div>
        <div className="bg-green-500 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between">
          <div className="text-sm font-medium opacity-80 mb-2">ফায়ারবেস ডেটা</div>
          <div className="text-4xl font-bold">{firebaseData.length}</div>
        </div>
        <div className="bg-yellow-500 rounded-2xl p-6 shadow-sm text-gray-900 flex flex-col justify-between">
          <div className="text-sm font-medium opacity-80 mb-2">Rajuk + Landbd</div>
          <div className="text-4xl font-bold">2 সেবা</div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 shadow-sm text-white flex flex-col justify-between">
          <div className="text-sm font-medium opacity-80 mb-2">অ্যাপ সেটিংস</div>
          <div className="text-4xl font-bold">Live</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {loading ? (
          <div className="col-span-full text-center py-10 text-[var(--text-secondary)] font-medium flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin mr-3"></span>
            ফায়ারবেস ডেটা লোড হচ্ছে...
          </div>
        ) : (
          firebaseData.map((item) => (
            <div key={item.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-colors">
              <div className="flex items-center gap-3 mb-4 text-[var(--text-secondary)]">
                <div className="bg-[var(--bg)] p-2 rounded-lg">
                  {item.icon}
                </div>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{item.value}</div>
            </div>
          ))
        )}
      </div>

      <div className="card-new mb-8">
        <div className="p-6 md:p-8 border-b border-[var(--border)] flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h6 className="font-bold text-xl text-[var(--text-primary)] mb-1">API রেজিস্ট্রি</h6>
            <p className="text-sm text-[var(--text-secondary)] mb-0">
              Rajuk, Firebase, External এবং Landbd API-র তালিকা দেখুন।
            </p>
          </div>
          <div className="flex gap-4 flex-wrap items-center">
            <div className="w-48">
              <input
                type="text"
                placeholder="খুঁজুন..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
              />
            </div>
            <div className="w-40">
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(1);
                }}
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
              >
                <option value="all">সব ধরন</option>
                <option value="Rajuk">Rajuk</option>
                <option value="Firebase">Firebase</option>
                <option value="External">External</option>
              </select>
            </div>
            <button
              onClick={() =>
                setSortDir((direction) =>
                  direction === "asc" ? "desc" : "asc",
                )
              }
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors text-sm font-medium flex items-center"
            >
              নাম {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                  নাম
                </th>
                <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                  ধরন
                </th>
                <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                  এন্ডপয়েন্ট
                </th>
                <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                  স্ট্যাটাস
                </th>
                <th className="px-6 py-4 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
                  নোট
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {pageSlice.map((row) => (
                <tr key={row.name} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="px-6 py-4 font-bold text-[var(--text-primary)] text-sm">
                    {row.name}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        row.type === "Rajuk" 
                          ? "bg-green-500/10 text-green-500" 
                          : row.type === "Firebase" 
                            ? "bg-yellow-500/10 text-yellow-500" 
                            : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 text-[var(--text-secondary)] text-sm font-mono break-all max-w-xs"
                  >
                    {row.endpoint}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center bg-green-500/20 text-green-500 rounded-full px-3 py-1 text-xs font-bold">
                      <CheckCircle2 size={12} className="mr-1.5" />
                      active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
          <span className="text-sm text-[var(--text-secondary)] font-medium">
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filteredApis.length)} /{" "}
            {filteredApis.length}
          </span>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg)] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-sm font-bold text-[var(--text-primary)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg)] disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="card-new">
        <div className="p-6 md:p-8 border-b border-[var(--border)] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal size={24} className="text-[var(--accent)]" />
            <h6 className="font-bold text-xl text-[var(--text-primary)] mb-0">API Selection Panel</h6>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <span className="text-sm font-bold text-blue-500 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              Selected APIs: {selectedApis.length} of {API_REGISTRY.length}
            </span>
            <button
              onClick={selectAll}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors text-sm font-bold"
            >
              Select All
            </button>
            <button
              onClick={unselectAll}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors text-sm font-bold"
            >
              Unselect All
            </button>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <p className="text-sm text-[var(--text-secondary)] mb-0">
              একটি সমন্বিত লিঙ্ক তৈরি করতে একাধিক API নির্বাচন করুন।
            </p>
            <button
              onClick={() => {
                const dataStr =
                  "data:text/json;charset=utf-8," +
                  encodeURIComponent(
                    JSON.stringify(
                      {
                        info: {
                          name: "Rajuk API Collection (Full)",
                          schema:
                            "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
                        },
                        variable: [
                          { key: "baseUrl", value: window.location.origin },
                        ],
                        item: API_REGISTRY.map((api) => ({
                          name: api.name,
                          request: {
                            method: "GET",
                            url: api.endpoint.startsWith("http")
                              ? api.endpoint
                              : api.endpoint.startsWith("Hosted/")
                                ? `{{baseUrl}}/api/tiles?service=${encodeURIComponent(api.endpoint)}`
                                : `{{baseUrl}}${api.endpoint.startsWith("/") ? api.endpoint : "/" + api.endpoint}`,
                          },
                        })),
                      },
                      null,
                      2,
                    ),
                  );
                const anchor = document.createElement("a");
                anchor.setAttribute("href", dataStr);
                anchor.setAttribute(
                  "download",
                  "Rajuk API Collection (Full).json",
                );
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
              }}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors text-sm font-bold flex items-center"
            >
              <Database size={16} className="mr-2" /> Download Postman Collection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {API_REGISTRY.map((api, index) => (
              <div
                key={index}
                className={`border rounded-xl p-4 flex flex-col select-none transition-all cursor-pointer ${
                  selectedApis.includes(index) 
                    ? "bg-blue-500/10 border-blue-500" 
                    : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--accent)]"
                }`}
                onClick={() => handleCheckboxChange(index)}
              >
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500 mr-3 cursor-pointer"
                    checked={selectedApis.includes(index)}
                    onChange={() => {}}
                  />
                  <span className="font-bold text-[var(--text-primary)] truncate block flex-1" title={api.name}>
                    {api.name}
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      api.status === "active" ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"
                    }`}
                  >
                    {api.status}
                  </span>
                </div>
                <div
                  className="pl-7 text-xs text-[var(--text-secondary)] font-mono truncate"
                  title={api.endpoint}
                >
                  {api.endpoint}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-8 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <button
              onClick={() => {
                if (selectedApis.length === 0) return;
                const url = new URL(
                  window.location.origin + "/admin/data-monitor/result",
                );
                url.searchParams.set("apis", selectedApis.join(","));
                setGeneratedLink(url.toString());
              }}
              disabled={selectedApis.length === 0}
              className="cta-gradient text-[var(--bg)] font-bold px-6 py-3 rounded-xl disabled:opacity-50 whitespace-nowrap shadow-md hover:-translate-y-0.5 transition-transform"
            >
              Generate Combined Link
            </button>

            {generatedLink && (
              <div
                className="flex items-stretch rounded-xl overflow-hidden border border-[var(--border)] shadow-sm w-full lg:w-auto flex-1"
              >
                <input
                  type="text"
                  className="flex-1 bg-[var(--surface)] border-0 text-sm text-[var(--text-secondary)] px-4 min-w-[200px]"
                  value={generatedLink}
                  readOnly
                />
                <button
                  onClick={copyLink}
                  className="px-4 font-bold text-[var(--text-primary)] bg-[var(--bg)] border-l border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                >
                  Copy
                </button>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 font-bold text-white bg-green-500 hover:bg-green-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <PlayCircle size={18} /> Open in New Tab
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
