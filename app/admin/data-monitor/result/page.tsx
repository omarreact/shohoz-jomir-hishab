"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_REGISTRY } from "../page";
import { Activity, ArrowLeft, Terminal, CheckCircle2, XCircle, Clock, Database, AlertTriangle } from "lucide-react";
import Link from "next/link";
import DynamicApiTable from "@/components/features/admin/DynamicApiTable";

interface TestResult {
  apiIndex: number;
  name: string;
  endpoint: string;
  status: number;
  timeMs: number;
  data: any;
  error?: string;
  recordCount: number;
}

function CombinedResultContent() {
  const searchParams = useSearchParams();
  const apisParam = searchParams.get("apis");
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    const fetchApis = async () => {
      if (!apisParam) {
        setLoading(false);
        return;
      }
      
      const indices = apisParam.split(",").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
      if (indices.length === 0) {
        setLoading(false);
        return;
      }

      const startTime = performance.now();
      
      const fetchedResults = await Promise.all(
        indices.map(async (idx) => {
          const api = API_REGISTRY[idx];
          if (!api) return null;
          
          const startReqTime = performance.now();
          try {
            let urlToFetch = api.endpoint;
            if (urlToFetch.startsWith("/")) {
               urlToFetch = window.location.origin + urlToFetch;
            }
            
            const res = await fetch(urlToFetch);
            let jsonData = null;
            let recordCount = 0;
            
            try {
              jsonData = await res.json();
              
              // Try to determine record count
              if (Array.isArray(jsonData)) {
                recordCount = jsonData.length;
              } else if (jsonData && Array.isArray(jsonData.features)) {
                recordCount = jsonData.features.length; // ESRI format
              } else if (jsonData && Array.isArray(jsonData.data)) {
                recordCount = jsonData.data.length; // Common API format
              } else if (jsonData && typeof jsonData === 'object') {
                recordCount = 1;
              }
            } catch (e) {
              const text = await res.text();
              jsonData = { rawText: text };
              recordCount = 1;
            }
            
            return { 
              apiIndex: idx,
              name: api.name,
              endpoint: api.endpoint, 
              status: res.status, 
              timeMs: Math.round(performance.now() - startReqTime),
              data: jsonData,
              recordCount
            };
          } catch (e: any) {
            return { 
              apiIndex: idx,
              name: api?.name || "Unknown", 
              endpoint: api?.endpoint || "",
              status: 500, 
              timeMs: Math.round(performance.now() - startReqTime),
              data: null, 
              error: e.message,
              recordCount: 0
            };
          }
        })
      );
      
      setResults(fetchedResults.filter(r => r !== null) as TestResult[]);
      setTotalTime(Math.round(performance.now() - startTime));
      setLoading(false);
    };

    fetchApis();
  }, [apisParam]);

  if (!apisParam) {
    return (
      <div className="p-4">
        <div className="alert alert-warning">No APIs selected. Please go back and select APIs to test.</div>
        <Link href="/admin/data-monitor" className="btn btn-outline-secondary">Go Back</Link>
      </div>
    );
  }

  const successfulCount = results.filter(r => r.status === 200).length;
  const failedCount = results.length - successfulCount;
  const totalRecords = results.reduce((acc, curr) => acc + curr.recordCount, 0);

  return (
    <div className="p-4 fade-in">
      {/* ── Header ── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <Link href="/admin/data-monitor" className="btn btn-sm btn-light text-secondary rounded-pill mb-2 d-inline-flex align-items-center gap-1">
            <ArrowLeft size={14} /> Back to Registry
          </Link>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Activity size={22} className="text-primary" />
            Combined API Viewer
          </h4>
          <p className="text-muted small mb-0">
            Previewing multiple API responses in a unified dashboard.
          </p>
        </div>
        {loading && (
          <div className="d-flex align-items-center gap-2 text-primary fw-bold">
            <span className="spinner-border spinner-border-sm"></span> Fetching APIs...
          </div>
        )}
      </div>

      {/* ── Dashboard Overview ── */}
      {!loading && (
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-2">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="text-muted small fw-bold mb-1 d-flex align-items-center gap-1">
                <Terminal size={14}/> Selected APIs
              </div>
              <div className="fs-4 fw-bolder text-dark">{results.length}</div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
              <div className="text-muted small fw-bold mb-1 d-flex align-items-center gap-1">
                <Database size={14}/> Total Records
              </div>
              <div className="fs-4 fw-bolder text-primary">{totalRecords.toLocaleString()}</div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-2">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-success bg-opacity-10">
              <div className="text-success small fw-bold mb-1 d-flex align-items-center gap-1">
                <CheckCircle2 size={14}/> Successful
              </div>
              <div className="fs-4 fw-bolder text-success">{successfulCount}</div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-2">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-danger bg-opacity-10">
              <div className="text-danger small fw-bold mb-1 d-flex align-items-center gap-1">
                <XCircle size={14}/> Failed
              </div>
              <div className="fs-4 fw-bolder text-danger">{failedCount}</div>
            </div>
          </div>
          <div className="col-sm-12 col-lg-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-dark text-white">
              <div className="text-light opacity-75 small fw-bold mb-1 d-flex align-items-center gap-1">
                <Clock size={14}/> Execution Time
              </div>
              <div className="fs-4 fw-bolder">{totalTime} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Results Tables ── */}
      <div className="d-flex flex-column gap-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="text-muted fw-bold">Executing {apisParam?.split(',').length || 0} API requests in parallel...</p>
          </div>
        ) : (
          results.map((res, index) => (
            <div key={index} className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="card-header bg-white border-bottom p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div>
                  <h6 className="fw-bold mb-1">{res.name}</h6>
                  <div className="small text-muted font-monospace">{res.endpoint}</div>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span className="small text-muted fw-bold d-flex align-items-center"><Clock size={12} className="me-1"/>{res.timeMs} ms</span>
                  <span className={`badge rounded-pill px-3 py-2 ${res.status === 200 ? 'bg-success' : 'bg-danger'}`}>
                    Status: {res.status}
                  </span>
                </div>
              </div>
              <div className="card-body p-0">
                {res.error ? (
                  <div className="p-4 bg-light text-danger text-center">
                    <AlertTriangle size={24} className="mb-2" />
                    <p className="mb-0 fw-bold">{res.error}</p>
                  </div>
                ) : (
                  <DynamicApiTable data={res.data} apiName={res.name} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CombinedResultPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
      <CombinedResultContent />
    </Suspense>
  );
}
