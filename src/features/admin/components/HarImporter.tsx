"use client";

import React, { useState, useRef } from "react";
import { Upload, FileJson, CheckCircle, XCircle, PlayCircle, Loader2, Save, ExternalLink, Key, Database } from "lucide-react";
import { DiscoveredApi, DiscoveredToken, HarAnalysisSummary } from "@/types/har";

export default function HarImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState<HarAnalysisSummary | null>(null);
  const [apis, setApis] = useState<DiscoveredApi[]>([]);
  const [tokens, setTokens] = useState<DiscoveredToken[]>([]);
  
  const [selectedApis, setSelectedApis] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".har") || selectedFile.name.endsWith(".json")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("অনুগ্রহ করে একটি সঠিক .har অথবা .json ফাইল নির্বাচন করুন।");
        setFile(null);
      }
    }
  };

  const parseHarFile = async () => {
    if (!file) return;
    setIsParsing(true);
    setError(null);

      let entries: any[] = [];
      let isRegexFallback = false;

    try {
      const text = await file.text();
        try {
          const har = JSON.parse(text);
          if (har.log && har.log.entries) {
             entries = har.log.entries;
          } else {
             throw new Error("অবৈধ HAR ফাইল স্ট্রাকচার।");
          }
        } catch (e: any) {
          console.warn("HAR parsing failed, falling back to regex extraction for truncated file...");
          isRegexFallback = true;
          
          // Regex extraction for truncated files (ignores JSON structure)
          const urlMethodRegex = /"method"\s*:\s*"([^"]+)"\s*,\s*"url"\s*:\s*"([^"]+)"/gi;
          let match;
          while ((match = urlMethodRegex.exec(text)) !== null) {
             const method = match[1];
             const url = match[2];
             if (url.includes("rajuk.gov.bd") || url.includes("arcgis")) {
               entries.push({ request: { method, url } });
             }
          }

          // Extract Bearer tokens globally
          const tokenRegex = /"name"\s*:\s*"Authorization"\s*,\s*"value"\s*:\s*"Bearer\s+([^"]+)"/gi;
          let tokenMatch;
          while ((tokenMatch = tokenRegex.exec(text)) !== null) {
             entries.push({ 
                _extractedToken: tokenMatch[1],
                request: { url: "https://masterplan.rajuk.gov.bd/arcgis/extracted", method: "GET" } 
             });
          }
          
          if (entries.length === 0) {
             throw new Error("ফাইল থেকে কোনো তথ্য উদ্ধার করা সম্ভব হয়নি।");
          }
        }
      let rajukReqs = 0;
      let arcgisServices = 0;
      let mapServers = 0;
      let featureServers = 0;
      let queryEndpoints = 0;
      let legendEndpoints = 0;

      const discoveredApisMap = new Map<string, DiscoveredApi>();
      const discoveredTokensMap = new Map<string, DiscoveredToken>();

      entries.forEach((entry: any) => {
        const reqUrl = entry.request?.url;
        if (!reqUrl) return;

        let urlObj;
        try {
          urlObj = new URL(reqUrl);
        } catch {
          return;
        }

        // Only process masterplan.rajuk.gov.bd and other relevant domains
        if (!urlObj.hostname.includes("rajuk.gov.bd") && !urlObj.pathname.includes("/arcgis/")) {
          return;
        }

        rajukReqs++;
        const method = entry.request.method;
        const status = entry.response?.status;
        const contentType = entry.response?.content?.mimeType || "unknown";

        let serviceType = "Other API";
        let isArcgis = false;
        let operation = "fetch";
        let serviceName = "Unknown Service";
        let layerId = "";

        if (urlObj.pathname.includes("MapServer")) {
          serviceType = "MapServer";
          mapServers++;
          isArcgis = true;
        } else if (urlObj.pathname.includes("FeatureServer")) {
          serviceType = "FeatureServer";
          featureServers++;
          isArcgis = true;
        } else if (urlObj.pathname.includes("VectorTileServer")) {
          serviceType = "VectorTileServer";
          isArcgis = true;
        } else if (urlObj.pathname.includes("TileServer")) {
          serviceType = "TileServer";
          isArcgis = true;
        }

        if (isArcgis) {
          arcgisServices++;
          const parts = urlObj.pathname.split("/");
          const serverIdx = parts.findIndex(p => p.includes("Server"));
          if (serverIdx > 0) {
             serviceName = parts[serverIdx - 1] || "Unknown Service";
             if (parts.length > serverIdx + 1) {
               const nextPart = parts[serverIdx + 1];
               if (!isNaN(Number(nextPart))) {
                 layerId = nextPart;
               } else {
                 operation = nextPart;
               }
             }
             if (parts.length > serverIdx + 2 && layerId) {
               operation = parts[serverIdx + 2];
             }
          }
          if (operation === "query") queryEndpoints++;
          if (operation === "legend") legendEndpoints++;
        }

        // Extract tokens
        let tokenValue = "";
        let tokenType: DiscoveredToken['type'] = 'unknown';

        if (entry._extractedToken) {
           tokenValue = entry._extractedToken;
           tokenType = 'bearer';
        } else {
           // Check query string
           const tokenQuery = urlObj.searchParams.get("token") || urlObj.searchParams.get("access_token");
           if (tokenQuery) {
             tokenValue = tokenQuery;
             tokenType = 'arcgis';
           }

           // Check headers
           const authHeader = entry.request.headers?.find((h: any) => h.name.toLowerCase() === "authorization");
           if (!tokenValue && authHeader && authHeader.value.toLowerCase().startsWith("bearer ")) {
             tokenValue = authHeader.value.split(" ")[1];
             tokenType = 'bearer';
           }
        }

        const normalizedUrlPath = urlObj.origin + urlObj.pathname;
        const apiId = `${method}_${normalizedUrlPath}`;

        if (!entry._extractedToken && !discoveredApisMap.has(apiId)) {
           discoveredApisMap.set(apiId, {
             id: apiId,
             name: `${serviceName} ${layerId ? `(Layer ${layerId})` : ''} ${operation !== 'fetch' ? `[${operation}]` : ''}`.trim(),
             url: normalizedUrlPath,
             method,
             host: urlObj.hostname,
             serviceType,
             serviceName,
             layerId,
             operation,
             requiresToken: !!tokenValue,
             status: 'আবিষ্কৃত',
             source: 'HAR',
             contentType
           });
        }

        if (tokenValue) {
           const tokenId = btoa(tokenValue.substring(0, 10)); // simple unique id
           if (!discoveredTokensMap.has(tokenId)) {
             discoveredTokensMap.set(tokenId, {
                id: tokenId,
                type: tokenType,
                source: 'HAR',
                host: urlObj.hostname,
                maskedToken: maskToken(tokenValue),
                tokenValue: tokenValue,
                firstSeen: entry.startedDateTime || new Date().toISOString(),
                lastSeen: entry.startedDateTime || new Date().toISOString(),
                associatedServices: entry._extractedToken ? [] : [apiId],
                confidence: 'high',
                status: 'যাচাই করা হয়নি'
             });
           } else {
             const existingToken = discoveredTokensMap.get(tokenId)!;
             if (entry.startedDateTime && new Date(entry.startedDateTime) > new Date(existingToken.lastSeen)) {
               existingToken.lastSeen = entry.startedDateTime;
             }
             if (!entry._extractedToken && !existingToken.associatedServices.includes(apiId)) {
               existingToken.associatedServices.push(apiId);
             }
           }
        }
      });

      if (rajukReqs === 0) {
        throw new Error("কোনো RAJUK API পাওয়া যায়নি।");
      }

      setApis(Array.from(discoveredApisMap.values()));
      setTokens(Array.from(discoveredTokensMap.values()));
      setSummary({
        totalRequests: isRegexFallback ? entries.length : entries.length,
        rajukRequests: rajukReqs,
        arcgisServices,
        mapServers,
        featureServers,
        queryEndpoints,
        legendEndpoints,
        tokensFound: discoveredTokensMap.size,
        uniqueApis: discoveredApisMap.size
      });
      
      // select all by default
      setSelectedApis(new Set(Array.from(discoveredApisMap.keys())));

    } catch (err: any) {
      console.error(err);
      setError(err.message || "ফাইল পার্স করতে সমস্যা হয়েছে।");
    } finally {
      setIsParsing(false);
    }
  };

  const maskToken = (token: string) => {
    if (token.length < 10) return "****";
    return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
  };

  const toggleApiSelection = (id: string) => {
    const newSet = new Set(selectedApis);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedApis(newSet);
  };
  
  const selectAll = () => setSelectedApis(new Set(apis.map(a => a.id)));
  const clearSelection = () => setSelectedApis(new Set());

  const validateToken = async (tokenId: string) => {
    const tokenObj = tokens.find(t => t.id === tokenId);
    if (!tokenObj) return;

    setIsValidatingToken(tokenId);
    
    // Pick an associated service to test
    let testUrl = "";
    if (tokenObj.associatedServices.length > 0) {
      const api = apis.find(a => a.id === tokenObj.associatedServices[0]);
      if (api) {
         testUrl = api.url;
         if (api.serviceType.includes("Server")) {
            testUrl += "?f=json";
         }
      }
    }

    try {
       const res = await fetch("/api/admin/rajuk-discovery/validate", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            tokenValue: tokenObj.tokenValue,
            tokenType: tokenObj.type,
            testUrl
         })
       });

       const data = await res.json();
       const newStatus = data.isValid ? "বৈধ" : "অবৈধ";
       
       setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: newStatus } : t));
       
       if (data.isValid) {
         alert("টোকেন বৈধ!");
       } else {
         alert("টোকেন অবৈধ বা মেয়াদ শেষ।");
       }
    } catch (e: any) {
       alert("ভ্যালিডেশন ব্যর্থ হয়েছে।");
       setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: "যাচাই করা যায়নি" } : t));
    } finally {
      setIsValidatingToken(null);
    }
  };

  const importSelected = async () => {
    if (selectedApis.size === 0) return alert("কোনো API নির্বাচন করা হয়নি।");
    
    setIsImporting(true);
    const apisToImport = apis.filter(a => selectedApis.has(a.id));
    
    try {
      const res = await fetch("/api/admin/rajuk-discovery/import", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ apis: apisToImport })
      });
      
      if (!res.ok) throw new Error("ইমপোর্ট ব্যর্থ হয়েছে");
      
      alert("সফলভাবে ইমপোর্ট করা হয়েছে!");
      setApis(prev => prev.map(a => selectedApis.has(a.id) ? { ...a, status: "ইমপোর্ট করা হয়েছে" } : a));
      
      if (onImportComplete) onImportComplete();
      
    } catch (e: any) {
       alert(e.message);
    } finally {
       setIsImporting(false);
    }
  };
  
  const importToken = async (tokenId: string) => {
    const tokenObj = tokens.find(t => t.id === tokenId);
    if (!tokenObj) return;

    if (!confirm(`এই HAR ফাইলে একটি RAJUK authentication token পাওয়া গেছে।\n\nএটি সংবেদনশীল তথ্য।\n\nআপনি কি এটি নিরাপদ server-side configuration হিসেবে সংরক্ষণ করতে চান?`)) {
      return;
    }

    try {
      // Re-use the existing rajuk-config save endpoint which sets the main rajuk token
      const res = await fetch("/api/admin/rajuk-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenObj.tokenValue })
      });
      
      if (!res.ok) throw new Error("টোকেন ইমপোর্ট ব্যর্থ হয়েছে");
      
      alert("টোকেন সফলভাবে সেভ হয়েছে!");
      if (onImportComplete) onImportComplete();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredApis = apis.filter(a => {
    if (filter === "arcgis" && !a.url.includes("Server")) return false;
    if (filter === "token_required" && !a.requiresToken) return false;
    if (search && !a.url.toLowerCase().includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mt-8">
      <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800">
        <h5 className="font-bold text-xl text-slate-900 dark:text-white mb-2 flex items-center">
          <FileJson size={24} className="mr-3 text-[#006a4e]" />
          RAJUK HAR ফাইল ইমপোর্ট
        </h5>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          ব্রাউজার থেকে এক্সপোর্ট করা .har ফাইল আপলোড করে RAJUK API এবং টোকেন আবিষ্কার করুন।
        </p>

        {!summary && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-10 bg-slate-50 dark:bg-slate-950 transition-colors hover:border-[#006a4e] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".har,.json" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <Upload size={40} className="text-slate-500 dark:text-slate-400 mb-4" />
            <h6 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">হার ফাইল নির্বাচন করুন</h6>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
              {file ? file.name : "ক্লিক করে অথবা ড্র্যাগ-এন্ড-ড্রপ করে ফাইল নির্বাচন করুন। (Max: 50MB)"}
            </p>
            {error && (
              <div className="mt-4 text-red-500 text-sm font-bold flex items-center bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                <XCircle size={16} className="mr-2" /> {error}
              </div>
            )}
            
            <button 
              onClick={(e) => { e.stopPropagation(); parseHarFile(); }} 
              disabled={!file || isParsing}
              className="mt-6 bg-[#006a4e] text-white hover:bg-[#00523b] font-bold rounded-xl px-6 py-3 shadow-md hover:-translate-y-0.5 transition-transform flex justify-center items-center disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isParsing ? <><Loader2 size={18} className="animate-spin mr-2" /> ফাইল বিশ্লেষণ হচ্ছে...</> : "হার ফাইল বিশ্লেষণ করুন"}
            </button>
          </div>
        )}
      </div>

      {summary && (
        <div className="p-6 md:p-8">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 mb-8">
            <h6 className="font-bold text-lg mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 text-slate-900 dark:text-white">HAR বিশ্লেষণ সম্পন্ন</h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500 dark:text-slate-400">মোট Request</span>
                <span className="font-bold text-lg text-slate-900 dark:text-white">{summary.totalRequests}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500 dark:text-slate-400">RAJUK Request</span>
                <span className="font-bold text-lg text-slate-900 dark:text-white">{summary.rajukRequests}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500 dark:text-slate-400">ArcGIS Service</span>
                <span className="font-bold text-lg text-slate-900 dark:text-white">{summary.arcgisServices}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500 dark:text-slate-400">Unique API</span>
                <span className="font-bold text-lg text-slate-900 dark:text-white">{summary.uniqueApis}</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <span className="block text-slate-500 dark:text-slate-400">Token পাওয়া গেছে</span>
                <span className="font-bold text-lg text-amber-500">{summary.tokensFound}</span>
              </div>
            </div>
            <button 
              onClick={() => { setSummary(null); setApis([]); setTokens([]); setFile(null); }}
              className="mt-4 text-sm font-bold text-red-500 hover:underline"
            >
              রিসেট করুন
            </button>
          </div>

          {/* Tokens Table */}
          {tokens.length > 0 && (
             <div className="mb-10">
                <h6 className="font-bold text-xl mb-4 text-slate-900 dark:text-white flex items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                   <Key size={20} className="mr-2 text-amber-500" /> আবিষ্কৃত টোকেন
                </h6>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Type</th>
                          <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Host</th>
                          <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Masked Token</th>
                          <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Status</th>
                          <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {tokens.map((token, idx) => (
                           <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950">
                              <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{token.type}</td>
                              <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{token.host}</td>
                              <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white">{token.maskedToken}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  token.status === 'বৈধ' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                  token.status === 'অবৈধ' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                                  'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {token.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => validateToken(token.id)}
                                  disabled={isValidatingToken === token.id}
                                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold hover:bg-white dark:hover:bg-slate-900 disabled:opacity-50 text-slate-900 dark:text-white"
                                >
                                  {isValidatingToken === token.id ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
                                </button>
                                <button 
                                  onClick={() => importToken(token.id)}
                                  className="px-3 py-1.5 bg-[#006a4e] text-white rounded-lg text-sm font-bold hover:bg-[#00523b] shadow-sm"
                                >
                                  সংরক্ষণ করুন
                                </button>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {/* APIs Table */}
          <div>
            <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
              <h6 className="font-bold text-xl text-slate-900 dark:text-white flex items-center">
                 <Database size={20} className="mr-2 text-blue-500" /> আবিষ্কৃত API
              </h6>
              <div className="flex items-center gap-3">
                 <input 
                   type="text" 
                   placeholder="খুঁজুন..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] text-slate-900 dark:text-white"
                 />
                 <select 
                   value={filter} 
                   onChange={e => setFilter(e.target.value)}
                   className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:border-[#006a4e] focus:ring-1 focus:ring-[#006a4e] text-slate-900 dark:text-white"
                 >
                   <option value="all">সব API</option>
                   <option value="arcgis">ArcGIS API</option>
                   <option value="token_required">Token Required</option>
                 </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl mb-4">
              <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                     <th className="px-4 py-3 w-10">
                       <input 
                         type="checkbox" 
                         checked={selectedApis.size === filteredApis.length && filteredApis.length > 0} 
                         onChange={(e) => e.target.checked ? selectAll() : clearSelection()} 
                         className="rounded text-[#006a4e] focus:ring-[#006a4e]"
                       />
                     </th>
                     <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">API নাম</th>
                     <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Type</th>
                     <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Auth</th>
                     <th className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                   {filteredApis.map(api => (
                      <tr key={api.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer" onClick={() => toggleApiSelection(api.id)}>
                         <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selectedApis.has(api.id)}
                              onChange={() => toggleApiSelection(api.id)}
                              className="rounded text-[#006a4e] focus:ring-[#006a4e]"
                            />
                         </td>
                         <td className="px-4 py-3">
                           <div className="font-bold text-sm text-slate-900 dark:text-white">{api.name}</div>
                           <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-sm mt-1">{api.url}</div>
                         </td>
                         <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{api.serviceType}</td>
                         <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${api.requiresToken ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                               {api.requiresToken ? 'Token' : 'Public'}
                            </span>
                         </td>
                         <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{api.status}</td>
                      </tr>
                   ))}
                   {filteredApis.length === 0 && (
                     <tr><td colSpan={5} className="text-center py-6 text-slate-500 dark:text-slate-400">কোনো ডেটা পাওয়া যায়নি</td></tr>
                   )}
                 </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                 নির্বাচিত: {selectedApis.size}
              </span>
              <button 
                onClick={importSelected}
                disabled={selectedApis.size === 0 || isImporting}
                className="bg-[#006a4e] text-white hover:bg-[#00523b] px-5 py-2 rounded-lg font-bold shadow-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                নির্বাচিত API ইমপোর্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
