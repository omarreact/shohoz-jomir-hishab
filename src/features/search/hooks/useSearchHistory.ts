"use client";

import { useState, useEffect } from "react";

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: string;
  timestamp: number;
}

const HISTORY_KEY = "landbd_search_history";
const MAX_HISTORY = 10;

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load search history", e);
    }
  }, []);

  const addHistoryItem = (query: string, type: string) => {
    setHistory((prev) => {
      const newItem: SearchHistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        query,
        type,
        timestamp: Date.now(),
      };
      
      // Filter out duplicates (case-insensitive)
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );
      
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save search history", e);
      }
      
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {}
  };

  const removeHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return {
    history,
    addHistoryItem,
    clearHistory,
    removeHistoryItem,
  };
}
