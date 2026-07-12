import { useState, useEffect } from "react";

/**
 * useRajukToken — fetches and caches the active Rajuk API token.
 * Centralises token management so map components don't repeat this logic.
 */
export function useRajukToken() {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/rajuk-token")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.token) {
          setToken(d.token);
        } else {
          throw new Error("টোকেন পাওয়া যায়নি");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "ম্যাপ সংযোগ বিচ্ছিন্ন");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { token, loading, error };
}
