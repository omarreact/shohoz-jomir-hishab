import { useState, useEffect, useRef } from "react";
import { Search, MapPin, History, X, Command as CommandIcon, Loader2, Navigation, FileText, User, Mic, TrendingUp } from "lucide-react";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { SearchResult } from "../engine/types";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/src/shared/ui/command";
import { Button } from "@/src/shared/ui/button";
import { Badge } from "@/src/shared/ui/Badge";

interface SmartSearchPaletteProps {
  onClose: () => void;
  onSelectResult: (result: any) => void;
}

export default function SmartSearchPalette({ onClose, onSelectResult }: SmartSearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const { history, addHistoryItem, removeHistoryItem } = useSearchHistory();

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
      if (!res.ok) throw new Error("Search API response not ok");
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
        return <MapPin size={18} className="text-green-500" />;
      case "KHATIAN":
        return <FileText size={18} className="text-blue-500" />;
      case "NID":
        return <User size={18} className="text-yellow-500" />;
      default:
        return <MapPin size={18} className="text-muted-foreground" />;
    }
  };

  return (
    <CommandDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <CommandInput 
        placeholder="Search Plot, Mouza, RS, CS, Khatian, Address, Coordinates..." 
        value={query} 
        onValueChange={setQuery} 
      />
      
      <CommandList className="max-h-[60vh] overflow-y-auto">
        {!query.trim() && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <History size={16} /> Recent Searches
                </h4>
                {history.length > 0 ? (
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h) => (
                      <div 
                        key={h.id} 
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                        onClick={() => setQuery(h.query)}
                      >
                        <div className="flex items-center gap-2 text-foreground">
                          <History size={14} className="text-muted-foreground" />
                          <span>{h.query}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeHistoryItem(h.id); }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    No recent searches
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp size={16} /> Popular Searches
                </h4>
                <div className="space-y-1">
                  {["Gulshan, Dhaka", "RS Plot 145", "Khatian 234", "23.79, 90.41", "DAP Zone Residential"].map((pop, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm text-foreground"
                      onClick={() => setQuery(pop)}
                    >
                      <TrendingUp size={14} className="text-muted-foreground" />
                      <span>{pop}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="text-center text-sm">
                <CommandIcon size={20} className="mb-2 mx-auto text-primary" />
                <div className="font-medium text-foreground mb-3">Suggestions</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3" onClick={() => setQuery("RS Plot")}>RS / CS Plot</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3" onClick={() => setQuery("Address")}>Address</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3" onClick={() => setQuery("Coordinates")}>Coordinates</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3" onClick={() => setQuery("NID Number")}>NID Number</Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3" onClick={() => setQuery("Khatian")}>Khatian</Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {query.trim() && loading && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-primary mb-2" />
            <span className="text-sm font-medium">Querying Unified Search Engine...</span>
          </div>
        )}

        {query.trim() && !loading && results.length === 0 && (
          <CommandEmpty className="py-10">
            <div className="text-center flex flex-col items-center">
              <Search size={40} className="text-muted-foreground/30 mb-3" />
              <h5 className="font-bold text-foreground mb-1">No results found for &quot;{query}&quot;</h5>
              <p className="text-sm text-muted-foreground">The Search Engine queried multiple providers but found no matches.</p>
            </div>
          </CommandEmpty>
        )}

        {query.trim() && !loading && results.length > 0 && (
          <CommandGroup heading={analytics ? `Found ${analytics.resultsCount} results in ${analytics.totalTime}ms` : "Search Results"}>
            {results.map((res, i) => (
              <CommandItem 
                key={res.id || i}
                onSelect={() => handleSelect(res)}
                className="flex flex-col items-start p-3 gap-2 my-1 cursor-pointer border border-border/50 rounded-lg hover:border-primary/50"
              >
                <div className="flex w-full justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-full border border-border">
                      {renderIcon(res.type)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{res.title}</div>
                      <div className="text-sm text-muted-foreground">{res.subtitle}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="text-xs bg-muted/50">{res.type}</Badge>
                    {res.score && res.score.confidence > 0 && (
                      <Badge variant="outline" className={`text-xs ${res.score.confidence >= 0.9 ? 'border-green-500/50 text-green-500' : 'border-yellow-500/50 text-yellow-500'}`}>
                        {Math.round(res.score.confidence * 100)}% Match
                      </Badge>
                    )}
                  </div>
                </div>
                
                {res.actions && res.actions.length > 0 && (
                  <div className="flex gap-2 w-full mt-2 pt-2 border-t border-border/50">
                    {res.actions.map(action => (
                      <Badge 
                        key={action.id}
                        variant="secondary"
                        className="text-xs font-normal flex items-center gap-1 bg-background hover:bg-muted"
                      >
                        {action.type === 'fly-to' && <Navigation size={10} className="text-primary" />}
                        {action.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
