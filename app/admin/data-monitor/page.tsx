"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";

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

const MS_MAUZA_TOKEN = "a8G2bN9mqFsECE9ZUgn_Wj3vZ_onrRdJ9Uck8dMWUELQmzyydmv8pKkPeUA1Gez5_2eX-QZkJzhnnFSFbukM3qEq-7iBKPIZecCLlyQAPybJAr4AeWz5RvuTXRM_DVwlel3ojOLGRq9ApEm-dgCsfPeUcVz9COSLi4qoR0Dch9FQItydXvjBW760CddqCWZKQbF2OCe1_pCA2IgTZbspb1nbg9GNN-Xps6y__xJ2_r07AHU8jU5YF8acmqXR4M0Y0xFHPYFxk1TyeGtW9m2c-cBYSm5Gvh88otoEIVzIbVKfnPbVPQxL-d7AalqJbNZA9E3vbaXfhrZ-7-WNywio_A..";

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
        const postsSnap = await getDocs(collection(db, "posts"));
        rows.push({
          label: "মোট ব্লগ পোস্ট",
          value: postsSnap.size,
          category: "content",
          icon: <Globe size={16} />,
        });

        const pagesSnap = await getDocs(collection(db, "dynamic_pages"));
        rows.push({
          label: "কাস্টম পেজ",
          value: pagesSnap.size,
          category: "content",
          icon: <Database size={16} />,
        });

        const usersSnap = await getDocs(collection(db, "users"));
        rows.push({
          label: "নিবন্ধিত ব্যবহারকারী",
          value: usersSnap.size,
          category: "users",
          icon: <Users size={16} />,
        });

        const rajukToken = await getDoc(doc(db, "config", "rajuk_api"));
        rows.push({
          label: "রাজউক টোকেন কনফিগ",
          value: rajukToken.exists() ? "✓ সেট আছে" : "✗ নেই",
          category: "config",
          icon: <CheckCircle2 size={16} />,
        });

        const appSettings = await getDoc(doc(db, "config", "app_settings"));
        if (appSettings.exists()) {
          const data = appSettings.data();
          rows.push({
            label: "মেইনটেন্যান্স মোড",
            value: data.maintenanceMode ? "চালু" : "বন্ধ",
            category: "config",
            icon: <AlertTriangle size={16} />,
          });
          rows.push({
            label: "ঘোষণা (Announcement)",
            value: data.announcement || "—",
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
    <div className="fade-in" data-admin-panel="true">
      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <SectionHeader 
          title="ডেটা মনিটর" 
          subtitle="API, Firebase এবং কনফিগারেশন সবকিছু এক জায়গায় দেখুন এবং পরিচালনা করুন।"
          className="mb-0"
        />
        <div className="d-flex gap-2 flex-wrap">
          <Button
            onClick={() => setRefreshKey((value) => value + 1)}
            variant="outline"
            className="rounded-pill"
            leftIcon={<RefreshCw size={15} />}
          >
            রিফ্রেশ
          </Button>
          <Link href="/admin/data-monitor/result" className="text-decoration-none">
            <Button
              variant="primary"
              className="rounded-pill"
              leftIcon={<ExternalLink size={15} />}
            >
              রেজাল্ট পেজ
            </Button>
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 rounded-4 shadow-sm h-100 p-3 bg-primary text-white">
            <div className="small opacity-75">সক্রিয় API</div>
            <div className="fs-3 fw-bold">{activeApis}</div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 rounded-4 shadow-sm h-100 p-3 bg-success text-white">
            <div className="small opacity-75">ফায়ারবেস ডেটা</div>
            <div className="fs-3 fw-bold">{firebaseData.length}</div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 rounded-4 shadow-sm h-100 p-3 bg-warning text-dark">
            <div className="small opacity-75">Rajuk + Landbd</div>
            <div className="fs-3 fw-bold">2 সেবা</div>
          </div>
        </div>
        <div className="col-lg-3 col-sm-6">
          <div className="card border-0 rounded-4 shadow-sm h-100 p-3 bg-dark text-white">
            <div className="small opacity-75">অ্যাপ সেটিংস</div>
            <div className="fs-3 fw-bold">Live</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {loading ? (
          <div className="col-12 text-center py-3 text-secondary">
            ফায়ারবেস ডেটা লোড হচ্ছে...
          </div>
        ) : (
          firebaseData.map((item) => (
            <div key={item.label} className="col-sm-6 col-xl-4">
              <Card 
                className={`border-0 shadow-sm h-100 p-3`}
                style={{ backgroundColor: item.category === "config" ? "var(--slate-800)" : item.category === "users" ? "var(--slate-700)" : "var(--card-bg)" }}
              >
                <div className="d-flex align-items-center gap-2 mb-2 opacity-75 text-secondary">
                  {item.icon}
                  <span className="small fw-bold">{item.label}</span>
                </div>
                <div className="fs-4 fw-bolder text-white">{item.value}</div>
              </Card>
            </div>
          ))
        )}
      </div>

      <Card className="mb-4">
        <CardHeader className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div>
            <h6 className="fw-bold mb-1">API রেজিস্ট্রি</h6>
            <p className="small text-muted mb-0">
              Rajuk, Firebase, External এবং Landbd API-র তালিকা দেখুন।
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-end">
            <div style={{ width: 200, marginBottom: '-16px' }}>
              <Input
                type="text"
                placeholder="খুঁজুন..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div style={{ width: 140, marginBottom: '-16px' }}>
              <Select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setPage(1);
                }}
                options={[
                  { label: "সব ধরন", value: "all" },
                  { label: "Rajuk", value: "Rajuk" },
                  { label: "Firebase", value: "Firebase" },
                  { label: "External", value: "External" }
                ]}
              />
            </div>
            <Button
              onClick={() => setSortDir((direction) => direction === "asc" ? "desc" : "asc")}
              variant="outline"
              size="sm"
              leftIcon={<ArrowUpDown size={13} />}
            >
              নাম
            </Button>
          </div>
        </CardHeader>

        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle table-dark bg-transparent">
            <thead>
              <tr>
                <th className="px-3 py-3 small fw-bold text-uppercase border-secondary">নাম</th>
                <th className="px-3 py-3 small fw-bold text-uppercase border-secondary">ধরন</th>
                <th className="px-3 py-3 small fw-bold text-uppercase border-secondary">
                  এন্ডপয়েন্ট
                </th>
                <th className="px-3 py-3 small fw-bold text-uppercase border-secondary">
                  স্ট্যাটাস
                </th>
                <th className="px-3 py-3 small fw-bold text-uppercase border-secondary">নোট</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((row) => (
                <tr key={row.name}>
                  <td className="px-3 py-2 fw-bold small text-white border-secondary">{row.name}</td>
                  <td className="px-3 py-2 border-secondary">
                    <span
                      className={`badge rounded-pill px-2 ${row.type === "Rajuk" ? "bg-success bg-opacity-10 text-success" : row.type === "Firebase" ? "bg-warning bg-opacity-10 text-warning" : "bg-primary bg-opacity-10 text-primary"}`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2 text-secondary small border-secondary"
                    style={{ maxWidth: 260, wordBreak: "break-all" }}
                  >
                    {row.endpoint}
                  </td>
                  <td className="px-3 py-2 border-secondary">
                    <span className="badge bg-success bg-opacity-25 text-success rounded-pill">
                      <CheckCircle2 size={11} className="me-1" />
                      active
                    </span>
                  </td>
                  <td className="px-3 py-2 text-secondary small border-secondary">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer bg-transparent border-top d-flex align-items-center justify-content-between px-3 py-2">
          <span className="small text-muted">
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filteredApis.length)} /{" "}
            {filteredApis.length}
          </span>
          <div className="d-flex gap-2">
            <Button
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="btn btn-sm disabled">
              {page} / {totalPages}
            </span>
            <Button
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page === totalPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <Terminal size={18} className="text-primary" />
            <h6 className="fw-bold mb-0">API Selection Panel</h6>
          </div>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <span className="small fw-bold text-primary bg-primary bg-opacity-10 px-3 py-1 rounded-pill">
              Selected APIs: {selectedApis.length} of {API_REGISTRY.length}
            </span>
            <Button onClick={selectAll} variant="outline" size="sm" className="rounded-pill">Select All</Button>
            <Button onClick={unselectAll} variant="outline" size="sm" className="rounded-pill">Unselect All</Button>
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <p className="small text-muted mb-0">
              একটি সমন্বিত লিঙ্ক তৈরি করতে একাধিক API নির্বাচন করুন।
            </p>
            <Button
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
              variant="outline"
              size="sm"
              className="rounded-pill"
              leftIcon={<Sparkles size={14} />}
            >
              Download Postman Collection
            </Button>
          </div>

          <div className="row g-3 mb-4">
            {API_REGISTRY.map((api, index) => (
              <div key={index} className="col-md-6 col-xl-4">
                <div
                  className={`form-check border rounded-3 p-3 d-flex flex-column user-select-none h-100 ${selectedApis.includes(index) ? "bg-primary bg-opacity-10 border-primary" : "border-secondary border-opacity-25"}`}
                  style={{ cursor: "pointer", backgroundColor: selectedApis.includes(index) ? "var(--primary-color)20" : "var(--card-bg-secondary)" }}
                  onClick={() => handleCheckboxChange(index)}
                >
                  <div className="d-flex align-items-center mb-1">
                    <input
                      className="form-check-input ms-1 me-2"
                      type="checkbox"
                      checked={selectedApis.includes(index)}
                      onChange={() => {}}
                    />
                    <label
                      className="form-check-label fw-bold text-truncate text-white"
                      style={{ pointerEvents: "none" }}
                      title={api.name}
                    >
                      {api.name}
                    </label>
                    <span
                      className={`badge ms-auto ${api.status === "active" ? "bg-success bg-opacity-25 text-success" : "bg-secondary text-white"}`}
                      style={{ fontSize: "0.65rem" }}
                    >
                      {api.status}
                    </span>
                  </div>
                  <div
                    className="ms-4 ps-2 small text-secondary text-truncate"
                    title={api.endpoint}
                  >
                    {api.endpoint}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex flex-wrap gap-3 align-items-center border-top border-light pt-4">
            <Button
              onClick={() => {
                if (selectedApis.length === 0) return;
                const url = new URL(
                  window.location.origin + "/admin/data-monitor/result",
                );
                url.searchParams.set("apis", selectedApis.join(","));
                setGeneratedLink(url.toString());
              }}
              disabled={selectedApis.length === 0}
              variant="primary"
              className="rounded-pill px-4"
              leftIcon={<Link2 size={16} />}
            >
              Generate Combined Link
            </Button>

            {generatedLink && (
              <div
                className="input-group shadow-sm rounded-pill overflow-hidden flex-nowrap"
                style={{ maxWidth: 800 }}
              >
                <input
                  type="text"
                  className="form-control bg-light border-0 small text-muted px-3"
                  value={generatedLink}
                  readOnly
                />
                <button
                  onClick={copyLink}
                  className="btn btn-outline-secondary fw-bold px-3"
                >
                  Copy
                </button>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-success fw-bold d-flex align-items-center gap-2 px-4"
                >
                  <PlayCircle size={16} /> Open in New Tab
                </a>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
