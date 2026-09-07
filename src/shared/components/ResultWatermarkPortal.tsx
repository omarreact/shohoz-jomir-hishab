"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ResultWatermark from "@/src/shared/components/ResultWatermark";

type Props = {
  targetRef: React.RefObject<HTMLElement | null>;
};

type ChildStyleSnapshot = {
  node: HTMLElement;
  position: string;
  zIndex: string;
};

export default function ResultWatermarkPortal({ targetRef }: Props) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setTarget(targetRef.current));
    return () => cancelAnimationFrame(frame);
  }, [targetRef]);

  useEffect(() => {
    if (!target) return;

    const hadRelative = target.classList.contains("relative");
    const hadIsolate = target.classList.contains("isolate");
    target.classList.add("relative", "isolate");
    target.dataset.resultDocument = "1";

    const childStyles: ChildStyleSnapshot[] = Array.from(target.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .filter((child) => child.dataset.landbdWatermark !== "1")
      .map((node) => ({
        node,
        position: node.style.position,
        zIndex: node.style.zIndex,
      }));

    childStyles.forEach(({ node }) => {
      node.style.position = "relative";
      node.style.zIndex = "1";
    });

    return () => {
      childStyles.forEach(({ node, position, zIndex }) => {
        node.style.position = position;
        node.style.zIndex = zIndex;
      });
      if (!hadRelative) target.classList.remove("relative");
      if (!hadIsolate) target.classList.remove("isolate");
      delete target.dataset.resultDocument;
    };
  }, [target]);

  return target ? createPortal(<ResultWatermark />, target) : null;
}
