"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, History, X, Command, Loader2, Navigation, FileText, User, Mic, TrendingUp } from "lucide-react";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { SearchResult } from "../engine/types";
import { t } from "@/src/locales";

interface SmartSearchPaletteProps {
  onClose: () => void;
  onSelectResult: (result: any) => void;
}

export default function SmartSearchPalette({ onClose, onSelectResult }: SmartSearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { history, addHistoryItem, removeHistoryItem } = useSearchHistory();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setAnalytics(null);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (rawQuery: string) => {
    setLoading(true);
    try {
      const url = new URL("/api/search/smart", window.location.origin);
      url.searchParams.set("q", rawQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (data.success) {
        setResults(data.results || []);
        setAnalytics(data.analytics || null);
      } else {
        setResults([]);
        setAnalytics(null);
      }
    } catch (e) {
      console.error(e);
      setResults([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: SearchResult) => {
    addHistoryItem(query || item.title || "Selected Item", item.type);
    onSelectResult(item);
    onClose();
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "RS_PLOT":
      case "MS_PLOT":
      case "COORDINATE":
        return <MapPin size={18} className="text-success" />;
      case "KHATIAN":
        return <FileText size={18} className="text-primary" />;
      case "NID":
        return <User size={18} className="text-warning" />;
      default:
        return <MapPin size={18} className="text-secondary" />;
    }
  };

  return (
    <>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 z-index-modal animate-fade-in"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      />
      <div 
        role="dialog"
        aria-label="Smart Search"
        className="position-fixed top-50 start-50 translate-middle w-100 rounded-4 shadow-lg d-flex flex-column animate-slide-up overflow-hidden"
        style={{ maxWidth: "650px", zIndex: 1050, maxHeight: "85vh", backgroundColor: "var(--card-bg)", border: "1px solid var(--border-color)" }}
      >
        <div className="d-flex align-items-center border-bottom border-secondary border-opacity-25 px-3 py-3" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
          <Search size={20} className="text-secondary me-2" />
          <input 
            ref={inputRef}
            type="text" 
            className="form-control form-control-lg border-0 shadow-none px-0 bg-transparent text-white" 
            placeholder="Search Plot, Mouza, RS, CS, Khatian, Address, Coordinates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontSize: "1.1rem" }}
          />
          <button className="btn btn-sm btn-link text-secondary p-1 ms-2 hover-text-primary transition-colors" title="Voice Search (Coming Soon)">
            <Mic size={18} />
          </button>
          <button className="btn btn-sm btn-link text-secondary p-1 ms-2 hover-text-primary transition-colors" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-grow-1 overflow-auto p-2 bg-transparent text-white">
          {!query.trim() ? (
            <div className="p-3">
              <div className="row">
                <div className="col-md-6 border-end border-secondary border-opacity-25">
                  <h6 className="text-secondary small fw-bold mb-3 d-flex align-items-center gap-2">
                    <History size={14} /> Recent Searches
                  </h6>
                  {history.length > 0 ? (
                    <div className="d-flex flex-column gap-1">
                      {history.slice(0, 5).map((h) => (
                        <div 
                          key={h.id} 
                          className="d-flex align-items-center justify-content-between p-2 rounded-3 cursor-pointer transition-colors hover-bg-dark"
                          onClick={() => setQuery(h.query)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-circle border border-secondary border-opacity-25" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                              <History size={14} className="text-secondary" />
                            </div>
                            <span className="fw-medium text-white">{h.query}</span>
                          </div>
                          <button 
                            className="btn btn-link text-secondary p-1 text-decoration-none hover-text-primary"
                            onClick={(e) => { e.stopPropagation(); removeHistoryItem(h.id); }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-secondary py-4 small">
                      No recent searches
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <h6 className="text-secondary small fw-bold mb-3 d-flex align-items-center gap-2 mt-3 mt-md-0">
                    <TrendingUp size={14} /> Popular Searches
                  </h6>
                  <div className="d-flex flex-column gap-1">
                    {["Gulshan, Dhaka", "RS Plot 145", "Khatian 234", "23.79, 90.41", "DAP Zone Residential"].map((pop, idx) => (
                      <div 
                        key={idx} 
                        className="d-flex align-items-center gap-3 p-2 rounded-3 cursor-pointer transition-colors hover-bg-dark"
                        onClick={() => setQuery(pop)}
                      >
                        <div className="p-2 rounded-circle border border-secondary border-opacity-25" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                          <TrendingUp size={14} className="text-secondary" />
                        </div>
                        <span className="fw-medium text-white">{pop}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 border border-secondary border-opacity-25 rounded-4 text-center text-secondary small shadow-sm" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                <Command size={20} className="mb-2 text-primary" />
                <div className="fw-bold text-white">Suggestions:</div>
                <div className="mt-3 d-flex flex-wrap gap-2 justify-content-center">
                  <span className="badge border border-secondary border-opacity-25 text-white px-3 py-2 cursor-pointer rounded-pill hover-bg-dark transition-colors" onClick={() => setQuery("RS Plot")}>RS / CS Plot</span>
                  <span className="badge border border-secondary border-opacity-25 text-white px-3 py-2 cursor-pointer rounded-pill hover-bg-dark transition-colors" onClick={() => setQuery("Address")}>Address</span>
                  <span className="badge border border-secondary border-opacity-25 text-white px-3 py-2 cursor-pointer rounded-pill hover-bg-dark transition-colors" onClick={() => setQuery("Coordinates")}>Coordinates</span>
                  <span className="badge border border-secondary border-opacity-25 text-white px-3 py-2 cursor-pointer rounded-pill hover-bg-dark transition-colors" onClick={() => setQuery("NID Number")}>NID Number</span>
                  <span className="badge border border-secondary border-opacity-25 text-white px-3 py-2 cursor-pointer rounded-pill hover-bg-dark transition-colors" onClick={() => setQuery("Khatian")}>Khatian</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {loading && (
                <div className="d-flex align-items-center justify-content-center py-5 text-secondary gap-2">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="fw-medium">Querying Unified Search Engine...</span>
                </div>
              )}
              
              {!loading && analytics && (
                <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                  <span className="small text-secondary fw-bold">
                    Found {analytics.resultsCount} results in {analytics.totalTime}ms
                  </span>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="d-flex flex-column gap-2">
                  {results.map((res, i) => (
                    <div 
                      key={res.id || i}
                      className="p-3 border border-secondary border-opacity-25 rounded-4 cursor-pointer transition-all d-flex flex-column gap-2 hover-bg-dark"
                      style={{ backgroundColor: "var(--card-bg-secondary)" }}
                      onClick={() => handleSelect(res)}
                    >
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                          <div className="p-2 rounded-circle border border-secondary border-opacity-25" style={{ backgroundColor: "var(--card-bg)" }}>
                            {renderIcon(res.type)}
                          </div>
                          <div>
                            <div className="fw-bold text-white fs-6">{res.title}</div>
                            <div className="text-secondary small">{res.subtitle}</div>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-1">
                          <span className="badge border border-secondary border-opacity-25 text-secondary bg-transparent">
                            {res.type}
                          </span>
                          {res.score && res.score.confidence > 0 && (
                            <span className={`badge border ${res.score.confidence >= 0.9 ? 'border-success text-success' : 'border-warning text-warning'} bg-transparent border-opacity-50`}>
                              {Math.round(res.score.confidence * 100)}% Match
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {res.actions && res.actions.length > 0 && (
                        <div className="d-flex gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25">
                          {res.actions.map(action => (
                            <button 
                              key={action.id}
                              className="btn btn-sm border border-secondary border-opacity-25 text-white d-flex align-items-center gap-1 hover-bg-dark transition-colors"
                              style={{ backgroundColor: "var(--card-bg)" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(res);
                              }}
                            >
                              {action.type === 'fly-to' ? <Navigation size={12} className="text-primary" /> : null}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!loading && results.length === 0 && query.trim() && (
                <div className="text-center text-secondary py-5">
                  <Search size={40} className="opacity-25 mb-3 mx-auto" />
                  <h5 className="fw-bold text-white">No results found for "{query}"</h5>
                  <p className="small">The Search Engine queried multiple providers but found no matches.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
