"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import ResultWatermark from "@/src/shared/components/ResultWatermark";

type Props = {
  targetRef: React.RefObject<HTMLElement | null>;
};

export default function ResultWatermarkPortal({ targetRef }: Props) {
  const target = targetRef.current;

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    const hadRelative = node.classList.contains("relative");
    const hadIsolate = node.classList.contains("isolate");
    node.classList.add("relative", "isolate");
    node.dataset.resultDocument = "1";

    return () => {
      if (!hadRelative) node.classList.remove("relative");
      if (!hadIsolate) node.classList.remove("isolate");
      delete node.dataset.resultDocument;
    };
  }, [targetRef, target]);

  return target ? createPortal(<ResultWatermark />, target) : null;
}
