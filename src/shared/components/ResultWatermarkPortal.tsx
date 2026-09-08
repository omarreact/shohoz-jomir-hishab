"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ResultWatermark from "@/src/shared/components/ResultWatermark";

type Props = {
  targetRef: React.RefObject<HTMLElement | null>;
};

/**
 * Read-only portal used by legacy result layouts. The target component owns
 * its positioning/layering so React state is never mutated through a DOM node.
 */
export default function ResultWatermarkPortal({ targetRef }: Props) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPortalTarget(targetRef.current));
    return () => cancelAnimationFrame(frame);
  }, [targetRef]);

  return portalTarget ? createPortal(<ResultWatermark />, portalTarget) : null;
}
