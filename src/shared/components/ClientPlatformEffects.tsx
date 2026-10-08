"use client";

import { useEffect } from "react";

/** Preserve legacy PWA cleanup independently of the page layout. */
export default function ClientPlatformEffects() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations()
        .then(registrations => registrations.forEach(r => { void r.unregister(); }))
        .catch(() => undefined);
    }

    if ("caches" in window) {
      void caches.keys()
        .then(keys => keys.forEach(key => { void caches.delete(key); }))
        .catch(() => undefined);
    }
  }, []);
  return null;
}
