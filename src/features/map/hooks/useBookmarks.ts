import { useState, useEffect } from "react";

export interface BookmarkItem {
  id: string;
  title: string;
  type: "position" | "plot" | "search";
  data: any;
  createdAt: number;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("landbd_bookmarks");
    if (stored) {
      try {
        setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse bookmarks", e);
      }
    }
  }, []);

  const saveBookmarks = (items: BookmarkItem[]) => {
    setBookmarks(items);
    localStorage.setItem("landbd_bookmarks", JSON.stringify(items));
  };

  const addBookmark = (title: string, type: "position" | "plot" | "search", data: any) => {
    const newItem: BookmarkItem = {
      id: crypto.randomUUID(),
      title,
      type,
      data,
      createdAt: Date.now(),
    };
    saveBookmarks([newItem, ...bookmarks]);
  };

  const removeBookmark = (id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const exportBookmarks = () => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LandBD_Bookmarks_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBookmarks = (jsonString: string) => {
    try {
      const items = JSON.parse(jsonString);
      if (Array.isArray(items)) {
        saveBookmarks([...items, ...bookmarks]); // Merge, or replace
      }
    } catch (e) {
      alert("Invalid backup file");
    }
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    exportBookmarks,
    importBookmarks
  };
}
