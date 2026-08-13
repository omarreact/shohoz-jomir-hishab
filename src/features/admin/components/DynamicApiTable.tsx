import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search, Download, Code, Table as TableIcon } from "lucide-react";
import { Input } from "@/src/shared/ui/Input";
import { Button } from "@/src/shared/ui/button";

interface DynamicApiTableProps {
  data: unknown;
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
      return data as Record<string, unknown>[];
    }
    
    // ESRI format
    const typedData = data as Record<string, unknown>;
    if (typedData.features && Array.isArray(typedData.features)) {
      return typedData.features.map((f: unknown) => {
        const feature = f as { attributes?: Record<string, unknown> };
        return {
          ...(feature.attributes || {}),
        };
      });
    }
    
    // Common object-wrapping array formats
    if (typedData.data && Array.isArray(typedData.data)) {
      return typedData.data as Record<string, unknown>[];
    }
    if (typedData.items && Array.isArray(typedData.items)) {
      return typedData.items as Record<string, unknown>[];
    }
    if (typedData.results && Array.isArray(typedData.results)) {
      return typedData.results as Record<string, unknown>[];
    }
    
    // If it's just a single object, wrap it
    if (typeof data === "object") {
      return [typedData];
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
    
    return normalizedData.filter((row) => {
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
    const csvContent = filteredData.map((row) => {
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
  const renderCell = (val: unknown) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground italic">null</span>;
    if (typeof val === "boolean") return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${val ? 'bg-success/10 text-success' : 'bg-secondary text-secondary-foreground'}`}>{val ? 'true' : 'false'}</span>;
    if (typeof val === "object") {
      return <span className="text-muted-foreground italic truncate inline-block font-mono text-xs" style={{ maxWidth: 150 }}>{JSON.stringify(val)}</span>;
    }
    return <span className="truncate inline-block text-sm" style={{ maxWidth: 200 }} title={String(val)}>{String(val)}</span>;
  };

  if (normalizedData.length === 0) {
    return (
      <div className="p-4 text-center bg-muted/30">
        <p className="text-muted-foreground mb-0 text-sm">No recognizable array data found in response.</p>
        <pre className="text-left mt-3 p-3 bg-slate-950 text-slate-300 text-xs overflow-auto rounded-lg max-h-48">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      {/* Table Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="text-muted-foreground text-xs font-bold">
          Showing <span className="text-foreground">{filteredData.length}</span> records
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
            <Input 
              type="text" 
              className="h-8 rounded-full pl-9 w-[220px] text-xs bg-background" 
              placeholder="Search data..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex rounded-full overflow-hidden border border-border shadow-sm">
            <button 
              onClick={() => setViewMode("table")} 
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <TableIcon size={14} /> Table
            </button>
            <div className="w-px bg-border"></div>
            <button 
              onClick={() => setViewMode("json")} 
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "json" ? "bg-secondary text-secondary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
            >
              <Code size={14} /> JSON
            </button>
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-full h-8 text-xs flex items-center gap-1 px-3">
            <Download size={14} /> CSV
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <>
          {/* Table Container */}
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground w-12 border-r border-border">#</th>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-xs font-bold text-muted-foreground border-r border-border last:border-0">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageData.length > 0 ? (
                  pageData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 text-center text-xs font-bold text-muted-foreground bg-muted/10 border-r border-border">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      {columns.map(col => (
                        <td key={col} className="px-4 py-2 text-sm border-r border-border last:border-0 text-foreground">
                          {renderCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                      No records match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="p-4 bg-slate-950 max-h-[450px] overflow-auto">
          <pre className="text-slate-300 text-xs font-mono mb-0">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
