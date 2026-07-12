"use client";

import { useState } from "react";

interface AnnouncementBannerProps {
  message: string;
}

/**
 * Dismissible announcement banner shown at the top of the homepage.
 * Receives the message from the parent (which fetches from Firebase).
 */
export default function AnnouncementBanner({ message }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!message || !visible) return null;

  return (
    <div
      className="bg-warning text-dark text-center py-2 px-4 position-relative fw-bold shadow-sm"
      style={{ zIndex: 1000 }}
    >
      <span>🔔 {message}</span>
      <button
        onClick={() => setVisible(false)}
        className="btn-close btn-close-dark position-absolute top-50 end-0 translate-middle-y me-3"
        style={{ fontSize: "0.8rem" }}
        aria-label="Close"
      />
    </div>
  );
}
