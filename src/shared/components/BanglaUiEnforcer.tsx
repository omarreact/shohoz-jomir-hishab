"use client";

import { useEffect } from "react";
import { translateUiText } from "@/src/shared/i18n/bangla";

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label", "aria-valuetext"] as const;
const SKIP_SELECTOR = [
  "script",
  "style",
  "code",
  "pre",
  "kbd",
  "samp",
  "textarea",
  "[contenteditable='true']",
  "[data-bangla-ignore='true']",
  "[translate='no']",
].join(",");

function shouldSkipNode(node: Node): boolean {
  const element = node.nodeType === Node.ELEMENT_NODE
    ? (node as Element)
    : node.parentElement;
  return Boolean(element?.closest(SKIP_SELECTOR));
}

function localizeTextNode(node: Text): void {
  if (shouldSkipNode(node)) return;
  const current = node.nodeValue;
  if (!current?.trim()) return;
  const localized = translateUiText(current);
  if (localized !== current) node.nodeValue = localized;
}

function localizeAttributes(element: Element): void {
  if (element.matches(SKIP_SELECTOR) || element.closest("[data-bangla-ignore='true'], [translate='no']")) {
    return;
  }

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const localized = translateUiText(current);
    if (localized !== current) element.setAttribute(attribute, localized);
  }
}

function localizeTree(root: Node): void {
  if (shouldSkipNode(root)) return;

  if (root.nodeType === Node.TEXT_NODE) {
    localizeTextNode(root as Text);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const element = root as Element;
  localizeAttributes(element);

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    localizeTextNode(current as Text);
    current = walker.nextNode();
  }

  element.querySelectorAll(TRANSLATABLE_ATTRIBUTES.map((attribute) => `[${attribute}]`).join(","))
    .forEach(localizeAttributes);
}

export default function BanglaUiEnforcer() {
  useEffect(() => {
    const body = document.body;
    localizeTree(body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          localizeTree(mutation.target);
          continue;
        }

        if (mutation.type === "attributes") {
          const target = mutation.target;
          if (target instanceof Element) localizeAttributes(target);
          continue;
        }

        mutation.addedNodes.forEach(localizeTree);
      }
    });

    observer.observe(body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
