import { useState, useEffect } from "react";

/**
 * useAnnouncement — fetches the global announcement string from the settings API.
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings?.announcement) {
          setAnnouncement(data.settings.announcement);
        }
      })
      .catch(() => {
        // Non-critical — fail silently
      });
  }, []);

  return announcement;
}
