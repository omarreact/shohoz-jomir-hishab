"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Database, Users, Globe, BarChart3, RefreshCw, CheckCircle2,
  AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight, Activity,
  Terminal, Link2, PlayCircle
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
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

// ── Static API Registry ───────────────────────────────────────────────
export const API_REGISTRY: ApiRow[] = [
  { name: "RS Plots (FeatureServer/0)",    endpoint: "/api/unified?include=plots&limit=1", type: "Rajuk",    status: "active",  note: "RS Plot geometry + attributes"       },
  { name: "MS Plots (FeatureServer/2)",    endpoint: "/api/unified?include=msPlots&limit=1", type: "Rajuk",    status: "active",  note: "MS Plot attributes (no geometry)"    },
  { name: "DAP Landuse (MapServer/0)",     endpoint: "/api/unified?include=landuse&limit=1", type: "Rajuk",   status: "active",  note: "Landuse zone intersection"           },
  { name: "Flood Overlay (MapServer/0)",   endpoint: "/api/unified?include=flood&limit=1", type: "Rajuk", status: "active",  note: "Flood risk zone intersection"        },
  { name: "MS Mauza Tiles",               endpoint: "Hosted/MS_Mauza_Tiles_Final (tile)", type: "Rajuk",   status: "active",  note: "MS survey raster tiles"              },
  { name: "RS Mauza Tiles",               endpoint: "Hosted/RS_Mauza_Tiles_Final (tile)", type: "Rajuk",   status: "active",  note: "RS survey raster tiles"              },
  { name: "RS Mauza 282 Scale",           endpoint: "Hosted/RS_Mauza_282Scale (tile)",    type: "Rajuk",   status: "active",  note: "High-res RS tiles (zoom 17+)"        },
  { name: "DAP Landuse Tiles",            endpoint: "Hosted/DAP_proposed_landuse (tile)", type: "Rajuk",   status: "active",  note: "Raster landuse layer"                },
  { name: "Overlay Boundary Tiles",       endpoint: "Hosted/Overlay_Boundary_Tiles (tile)", type: "Rajuk", status: "active",  note: "Rajuk administrative boundary"       },
  { name: "Rajuk Zone Subzone Tiles",     endpoint: "Hosted/Rajuk_Zone_Subzone_Tiles (tile)", type: "Rajuk", status: "active", note: "DAP zone & subzone layer"           },
  { name: "Transport Network Tiles",      endpoint: "Hosted/Transport_Network_Tiles (tile)", type: "Rajuk", status: "active",  note: "Proposed road network"              },
  { name: "Flood Overlay Tiles",          endpoint: "Hosted/flood_overlay_lvl11_20 (tile)", type: "Rajuk", status: "active",  note: "Visual flood zone overlay"           },
  { name: "Landmarks Tiles",             endpoint: "Hosted/Major_Landmarks_V2_TILES (tile)", type: "Rajuk", status: "active", note: "Major landmarks"                    },
  { name: "POI Proposed Tiles",          endpoint: "Hosted/POI_Proposed_Tiles (tile)",       type: "Rajuk", status: "active", note: "Proposed points of interest"         },
  { name: "Rajuk Token",                 endpoint: "/api/rajuk-token",                       type: "Firebase",status: "active", note: "Token from Firebase config/rajuk_api"},
  { name: "Open-Meteo Elevation",        endpoint: "https://api.open-meteo.com/v1/elevation?latitude=23.8103&longitude=90.4125", type: "External", status: "active", note: "Ground elevation at lat/lng"     },
  { name: "Porcha JSON",                 endpoint: "/api/porcha",                            type: "Firebase", status: "active", note: "Porcha data served as static JSON"  },
];

const PAGE_SIZE = 10;

export default function DataMonitorPage() {
  const [firebaseData, setFirebaseData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters & sort
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── API Tester states ─────────────────────────────────────────────
  const [selectedApis, setSelectedApis] = useState<number[]>([]);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{name: string, status: number, data: string}[]>([]);



  const handleCheckboxChange = (index: number) => {
    setSelectedApis(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const generateLink = () => {
    if (selectedApis.length === 0) return;
    const url = new URL(window.location.href);
    url.pathname = "/admin/data-monitor/result";
    url.search = ""; // clear previous
    url.searchParams.set("apis", selectedApis.join(","));
    setGeneratedLink(url.toString());
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Link copied to clipboard!");
  };

  const selectAll = () => setSelectedApis(API_REGISTRY.map((_, i) => i));
  const unselectAll = () => setSelectedApis([]);

  // Note: runApiTest and testResults are removed here since the actual testing happens on the result page.

  // ── Fetch Firebase stats ──────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const rows: DataRow[] = [];
      try {
        // Blog posts count
        const postsSnap = await getDocs(collection(db, "posts"));
        rows.push({ label: "মোট ব্লগ পোস্ট", value: postsSnap.size, category: "content", icon: <Globe size={16} /> });

        // Dynamic pages
        const pagesSnap = await getDocs(collection(db, "dynamic_pages"));
        rows.push({ label: "কাস্টম পেজ", value: pagesSnap.size, category: "content", icon: <Database size={16} /> });

        // Users
        const usersSnap = await getDocs(collection(db, "users"));
        rows.push({ label: "নিবন্ধিত ব্যবহারকারী", value: usersSnap.size, category: "users", icon: <Users size={16} /> });

        // Config docs
        const rajukToken = await getDoc(doc(db, "config", "rajuk_api"));
        rows.push({ label: "রাজউক টোকেন কনফিগ", value: rajukToken.exists() ? "✓ সেট আছে" : "✗ নেই", category: "config", icon: <CheckCircle2 size={16} /> });

        const appSettings = await getDoc(doc(db, "config", "app_settings"));
        if (appSettings.exists()) {
          const d = appSettings.data();
          rows.push({ label: "মেইনটেন্যান্স মোড",   value: d.maintenanceMode ? "চালু" : "বন্ধ", category: "config", icon: <AlertTriangle size={16} /> });
          rows.push({ label: "ঘোষণা (Announcement)", value: d.announcement || "—",                 category: "config", icon: <Activity size={16} /> });
        }
      } catch (e) {
        console.error("Data Monitor fetch error:", e);
      }
      setFirebaseData(rows);
      setLoading(false);
    };
    fetchStats();
  }, [refreshKey]);

  // ── Filter + sort API registry ────────────────────────────────────
  const filteredApis = API_REGISTRY
    .filter((r) => typeFilter === "all" || r.type === typeFilter)
    .filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.endpoint.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  const totalPages = Math.ceil(filteredApis.length / PAGE_SIZE);
  const pageSlice = filteredApis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4">
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <BarChart3 size={22} className="text-success" />
            ডেটা মনিটর (Data Monitor)
          </h4>
          <p className="text-muted small mb-0">
            সকল API এন্ডপয়েন্ট, ফায়ারবেস ডেটা এবং অ্যাপ কনফিগারেশন এক জায়গায়।
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="btn btn-outline-success btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
        >
          <RefreshCw size={14} /> রিফ্রেশ
        </button>
      </div>

      {/* ── Firebase Stats Cards ── */}
      <div className="row g-3 mb-4">
        {loading ? (
          <div className="col-12 text-center py-3 text-muted">ফায়ারবেস ডেটা লোড হচ্ছে...</div>
        ) : (
          firebaseData.map((d) => (
            <div key={d.label} className="col-sm-6 col-xl-4">
              <div className={`card border-0 shadow-sm rounded-4 h-100 p-3 ${
                d.category === "config" ? "bg-dark text-white" :
                d.category === "users" ? "bg-success bg-opacity-10" :
                "bg-white"
              }`}>
                <div className="d-flex align-items-center gap-2 mb-2 opacity-75">
                  {d.icon}
                  <span className="small fw-bold">{d.label}</span>
                </div>
                <div className="fs-4 fw-bolder">{d.value}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── API Registry Table ── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <h6 className="fw-bold mb-0">API রেজিস্ট্রি ({filteredApis.length} টি)</h6>
          <div className="d-flex gap-2 flex-wrap">
            <input
              type="text"
              className="form-control form-control-sm rounded-pill"
              placeholder="খুঁজুন..."
              style={{ width: 200 }}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select
              className="form-select form-select-sm rounded-pill"
              style={{ width: 140 }}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="all">সব ধরন</option>
              <option value="Rajuk">Rajuk</option>
              <option value="Firebase">Firebase</option>
              <option value="External">External</option>
            </select>
            <button
              onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1"
            >
              <ArrowUpDown size={13} /> নাম
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="px-3 py-3 small fw-bold text-uppercase">নাম</th>
                <th className="px-3 py-3 small fw-bold text-uppercase">ধরন</th>
                <th className="px-3 py-3 small fw-bold text-uppercase">এন্ডপয়েন্ট</th>
                <th className="px-3 py-3 small fw-bold text-uppercase">স্ট্যাটাস</th>
                <th className="px-3 py-3 small fw-bold text-uppercase">নোট</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((r) => (
                <tr key={r.name}>
                  <td className="px-3 py-2 fw-bold small">{r.name}</td>
                  <td className="px-3 py-2">
                    <span className={`badge rounded-pill px-2 ${
                      r.type === "Rajuk"    ? "bg-success bg-opacity-10 text-success" :
                      r.type === "Firebase" ? "bg-warning bg-opacity-10 text-warning" :
                                             "bg-primary bg-opacity-10 text-primary"
                    }`}>{r.type}</span>
                  </td>
                  <td className="px-3 py-2 text-muted small" style={{ maxWidth: 260, wordBreak: "break-all" }}>
                    {r.endpoint}
                  </td>
                  <td className="px-3 py-2">
                    <span className="badge bg-success rounded-pill">
                      <CheckCircle2 size={11} className="me-1" />active
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted small">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="card-footer bg-white border-top d-flex align-items-center justify-content-between px-3 py-2">
          <span className="small text-muted">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredApis.length)} / {filteredApis.length}
          </span>
          <div className="d-flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-sm btn-outline-secondary rounded-pill"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="btn btn-sm disabled">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-sm btn-outline-secondary rounded-pill"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── API Selection Panel ── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mt-4 fade-in">
        <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <Terminal size={18} className="text-primary" />
            <h6 className="fw-bold mb-0">API Selection Panel (Data Aggregator)</h6>
          </div>
          <button 
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                info: {
                  name: "Rajuk API Collection (Full)",
                  schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                },
                variable: [{ key: "baseUrl", value: window.location.origin }],
                item: API_REGISTRY.map(api => ({
                  name: api.name,
                  request: {
                    method: "GET",
                    url: api.endpoint.startsWith("http") ? api.endpoint : `{{baseUrl}}${api.endpoint.startsWith("/") ? api.endpoint : "/" + api.endpoint}`
                  }
                }))
              }, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href",     dataStr);
              downloadAnchorNode.setAttribute("download", "Rajuk API Collection (Full).json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="btn btn-sm btn-outline-dark rounded-pill d-flex align-items-center gap-2"
          >
            Download Postman Collection
          </button>
        </div>
        <div className="card-body p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <p className="small text-muted mb-0">
              Select multiple API endpoints below to generate a combined URL and preview all selected API responses in a unified table.
            </p>
            <div className="d-flex align-items-center gap-3">
              <span className="small fw-bold text-primary bg-primary bg-opacity-10 px-3 py-1 rounded-pill">
                Selected APIs: {selectedApis.length} of {API_REGISTRY.length}
              </span>
              <button onClick={selectAll} className="btn btn-sm btn-outline-secondary rounded-pill px-3">Select All</button>
              <button onClick={unselectAll} className="btn btn-sm btn-outline-secondary rounded-pill px-3">Unselect All</button>
            </div>
          </div>
          
          <div className="row g-3 mb-4">
            {API_REGISTRY.map((api, idx) => (
              <div key={idx} className="col-md-6 col-xl-4">
                <div 
                  className={`form-check border rounded-3 p-3 d-flex flex-column user-select-none transition-all h-100 ${selectedApis.includes(idx) ? 'bg-primary bg-opacity-10 border-primary' : 'bg-light'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCheckboxChange(idx)}
                >
                  <div className="d-flex align-items-center mb-1">
                    <input
                      className="form-check-input ms-1 me-2"
                      type="checkbox"
                      checked={selectedApis.includes(idx)}
                      onChange={() => {}} // Handled by div onClick
                    />
                    <label className="form-check-label fw-bold text-truncate" style={{ pointerEvents: 'none' }} title={api.name}>
                      {api.name}
                    </label>
                    <span className={`badge ms-auto ${api.status === 'active' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.65rem' }}>
                      {api.status}
                    </span>
                  </div>
                  <div className="ms-4 ps-2 small text-muted text-truncate" title={api.endpoint}>
                    {api.endpoint}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex flex-wrap gap-3 align-items-center border-top pt-4">
            <button 
              onClick={() => {
                if (selectedApis.length === 0) return;
                const url = new URL(window.location.origin + "/admin/data-monitor/result");
                url.searchParams.set("apis", selectedApis.join(","));
                setGeneratedLink(url.toString());
              }} 
              disabled={selectedApis.length === 0}
              className="btn btn-primary rounded-pill d-flex align-items-center gap-2 px-4 fw-bold shadow-sm"
            >
              <Link2 size={16} /> Generate Combined Link
            </button>
            
            {generatedLink && (
              <div className="input-group shadow-sm rounded-pill overflow-hidden flex-nowrap" style={{ maxWidth: 800 }}>
                <input type="text" className="form-control bg-light border-0 small text-muted px-3" value={generatedLink} readOnly />
                <button onClick={copyLink} className="btn btn-outline-secondary fw-bold px-3">Copy</button>
                <a href={generatedLink} target="_blank" rel="noreferrer" className="btn btn-success fw-bold d-flex align-items-center gap-2 px-4">
                  <PlayCircle size={16} /> Open in New Tab
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
