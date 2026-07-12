"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Download, Code, Table } from "lucide-react";

interface DynamicApiTableProps {
  data: any;
  apiName: string;
}

const PAGE_SIZE = 10;

export default function DynamicApiTable({ data, apiName }: DynamicApiTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "json">("table");

  // Normalize data to an array of objects
  const normalizedData = useMemo(() => {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data;
    }
    
    // ESRI format
    if (data.features && Array.isArray(data.features)) {
      return data.features.map((f: any) => ({
        ...f.attributes,
        // optionally include geometry if needed, but usually we just want attributes
      }));
    }
    
    // Common object-wrapping array formats
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // If it's just a single object, wrap it
    if (typeof data === "object") {
      return [data];
    }
    
    return [{ value: String(data) }];
  }, [data]);

  // Extract dynamic columns
  const columns = useMemo(() => {
    if (normalizedData.length === 0) return [];
    
    // Get all unique keys from all rows (or just the first 10 rows for performance)
    const keySet = new Set<string>();
    const sampleSize = Math.min(normalizedData.length, 50);
    for (let i = 0; i < sampleSize; i++) {
      if (normalizedData[i] && typeof normalizedData[i] === "object") {
        Object.keys(normalizedData[i]).forEach(k => keySet.add(k));
      }
    }
    return Array.from(keySet);
  }, [normalizedData]);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!search) return normalizedData;
    const lowerSearch = search.toLowerCase();
    
    return normalizedData.filter((row: any) => {
      if (!row || typeof row !== "object") return false;
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [normalizedData, search]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE) || 1;
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0 || columns.length === 0) return;
    
    const header = columns.join(",") + "\n";
    const csvContent = filteredData.map((row: any) => {
      return columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return "";
        // Escape quotes and wrap in quotes if contains comma
        const strVal = String(val).replace(/"/g, '""');
        if (strVal.includes(",") || strVal.includes("\n") || strVal.includes('"')) {
          return `"${strVal}"`;
        }
        return strVal;
      }).join(",");
    }).join("\n");
    
    const blob = new Blob([header + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${apiName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe renderer for cell values (objects/arrays)
  const renderCell = (val: any) => {
    if (val === null || val === undefined) return <span className="text-muted">null</span>;
    if (typeof val === "boolean") return <span className={`badge ${val ? 'bg-success' : 'bg-secondary'}`}>{val ? 'true' : 'false'}</span>;
    if (typeof val === "object") {
      return <span className="text-muted fst-italic text-truncate d-inline-block" style={{ maxWidth: 150 }}>{JSON.stringify(val)}</span>;
    }
    return <span className="text-truncate d-inline-block" style={{ maxWidth: 200 }} title={String(val)}>{String(val)}</span>;
  };

  if (normalizedData.length === 0) {
    return (
      <div className="p-4 text-center bg-light">
        <p className="text-muted mb-0 small">No recognizable array data found in response.</p>
        <pre className="text-start mt-3 p-3 bg-dark text-light small overflow-auto custom-scrollbar rounded-3" style={{ maxHeight: 200, fontSize: '0.75rem' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      {/* Table Toolbar */}
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between p-3 border-bottom bg-light bg-opacity-50">
        <div className="text-muted small fw-bold">
          Showing <span className="text-dark">{filteredData.length}</span> records
        </div>
        <div className="d-flex gap-2">
          <div className="position-relative">
            <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
            <input 
              type="text" 
              className="form-control form-control-sm rounded-pill ps-4" 
              placeholder="Search data..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </div>
          <div className="btn-group btn-group-sm rounded-pill shadow-sm">
            <button 
              onClick={() => setViewMode("table")} 
              className={`btn ${viewMode === "table" ? "btn-secondary" : "btn-outline-secondary"} d-flex align-items-center gap-1`}
            >
              <Table size={14} /> Table
            </button>
            <button 
              onClick={() => setViewMode("json")} 
              className={`btn ${viewMode === "json" ? "btn-secondary" : "btn-outline-secondary"} d-flex align-items-center gap-1`}
            >
              <Code size={14} /> JSON
            </button>
          </div>
          <button onClick={handleExportCSV} className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1 px-3">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <>
          {/* Table Container with custom scrollbar */}
          <div className="table-responsive custom-scrollbar" style={{ maxHeight: 400 }}>
        <table className="table table-hover table-bordered mb-0 align-middle small">
          <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
            <tr>
              <th className="px-3 py-2 text-center" style={{ width: 50 }}>#</th>
              {columns.map(col => (
                <th key={col} className="px-3 py-2 text-nowrap fw-bold">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length > 0 ? (
              pageData.map((row: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-center text-muted fw-bold bg-light">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-3 py-1">
                      {renderCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4 text-muted">
                  No records match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="d-flex align-items-center justify-content-between p-3 border-top bg-light bg-opacity-50">
        <span className="small text-muted">
          Page {page} of {totalPages}
        </span>
        <div className="d-flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-sm btn-white border rounded-pill d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32 }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-sm btn-white border rounded-pill d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32 }}
          >
            <ChevronRight size={16} />
            </button>
          </div>
        </div>
        </>
      ) : (
        <div className="p-3 bg-dark custom-scrollbar" style={{ maxHeight: 450, overflow: "auto" }}>
          <pre className="text-light small mb-0" style={{ fontSize: '0.8rem' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
