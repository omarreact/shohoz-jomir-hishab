import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * useAnnouncement — fetches the global announcement string from Firebase
 * and returns it to the homepage. Avoids putting Firebase reads directly in page.tsx.
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const docRef = doc(db, "config", "app_settings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.announcement) setAnnouncement(data.announcement);
        }
      } catch (error) {
        // Non-critical — fail silently
        console.error("Error fetching announcement:", error);
      }
    };
    fetchAnnouncement();
  }, []);

  return announcement;
}
