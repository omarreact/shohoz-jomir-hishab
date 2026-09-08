type ArcGisError = {
  code?: number | string;
  message?: string;
  details?: string[];
};

type ArcGisEnvelope = {
  error?: ArcGisError | string;
};

function errorMessage(data: ArcGisEnvelope | null | undefined): string {
  const raw = data?.error;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.message || raw.details?.filter(Boolean).join("; ") || "";
}

export function getRajukArcGisErrorCode(data: ArcGisEnvelope | null | undefined): number | undefined {
  const raw = data?.error;
  if (!raw || typeof raw === "string") return undefined;
  const code = Number(raw.code);
  return Number.isFinite(code) ? code : undefined;
}

export function isRajukArcGisAuthError(
  status: number,
  data: ArcGisEnvelope | null | undefined,
): boolean {
  const code = getRajukArcGisErrorCode(data);
  const message = errorMessage(data);
  return (
    status === 401 ||
    status === 403 ||
    code === 401 ||
    code === 403 ||
    code === 498 ||
    code === 499 ||
    /invalid token|token required|token is required|expired token/i.test(message)
  );
}

export function getRajukProxyErrorStatus(
  upstreamStatus: number,
  data: ArcGisEnvelope | null | undefined,
): number {
  if (isRajukArcGisAuthError(upstreamStatus, data)) return 502;
  return upstreamStatus >= 400 ? upstreamStatus : 502;
}

/** Return a diagnostic URL that can safely be displayed in the admin UI. */
export function sanitizeRajukDiagnosticUrl(value: string | URL): string {
  const url = new URL(value.toString());
  for (const key of [...url.searchParams.keys()]) {
    if (/token|key|password|secret/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}
