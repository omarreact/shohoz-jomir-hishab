#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const input = resolve(process.argv[2] ?? "scripts/investigation/captures/dlrms-network.raw.har");
const output = resolve(process.argv[3] ?? "scripts/investigation/captures/dlrms-network.sanitized.har");

if (!existsSync(input)) {
  console.error(`HAR not found: ${input}`);
  process.exit(1);
}

const har = JSON.parse(readFileSync(input, "utf8"));
const sensitiveKey = /authorization|cookie|set-cookie|token|access[_-]?token|password|secret|api[_-]?key|x-api-key/i;
const sensitiveValue = /(bearer\s+)[^\s,;]+/gi;
const personalKey = /nid|national.?id|mobile|phone|email|birth|owner|applicant/i;
const personalValue = /(?:^|[?&])(nid|national_id|mobile|phone|email|birth[^=]*)=[^&]*/gi;

function redactHeaders(headers = []) {
  return headers.map((header) => ({
    ...header,
    value: sensitiveKey.test(header.name) ? "[REDACTED]" : header.value.replace(sensitiveValue, "$1[REDACTED]"),
  }));
}

function redactUrl(value) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (sensitiveKey.test(key) || personalKey.test(key)) url.searchParams.set(key, "[REDACTED]");
    }
    return url.toString();
  } catch {
    return value.replace(personalValue, "[$1]=[REDACTED]");
  }
}

function redactBody(text) {
  if (!text) return text;
  let result = text.replace(sensitiveValue, "$1[REDACTED]");
  try {
    const parsed = JSON.parse(result);
    const walk = (value) => {
      if (Array.isArray(value)) return value.map(walk);
      if (!value || typeof value !== "object") return value;
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [
        key,
        sensitiveKey.test(key) || personalKey.test(key) ? "[REDACTED]" : walk(child),
      ]));
    };
    return JSON.stringify(walk(parsed));
  } catch {
    return result;
  }
}

for (const entry of har.log?.entries ?? []) {
  entry.request.url = redactUrl(entry.request.url);
  entry.request.headers = redactHeaders(entry.request.headers);
  if (entry.request.postData?.text) entry.request.postData.text = redactBody(entry.request.postData.text);
  entry.response.headers = redactHeaders(entry.response.headers);
  if (entry.response.content?.text) entry.response.content.text = redactBody(entry.response.content.text);
  delete entry.request.cookies;
  delete entry.response.cookies;
}

writeFileSync(output, `${JSON.stringify(har, null, 2)}\n`, "utf8");
console.log(`Sanitized HAR written to: ${output}`);
