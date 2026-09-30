import type { NidLookupRequest } from "./schema";

const DEFAULT_BASE_URL = "https://api.porichoybd.com";
const DEFAULT_NID_PATH = "/api/v2/verifications/autofill";

export class PorichoyError extends Error {
  status: number;
  code: string;
  upstreamStatus?: number;

  constructor(
    message: string,
    status = 502,
    code = "PORICHOY_ERROR",
    upstreamStatus?: number,
  ) {
    super(message);
    this.name = "PorichoyError";
    this.status = status;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
  }
}

function enabled(): boolean {
  return process.env.PORICHOY_ENABLED === "1";
}

function apiKey(): string {
  return process.env.PORICHOY_API_KEY?.trim() || "";
}

function endpoint(): string {
  const rawBase = (process.env.PORICHOY_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const path = process.env.PORICHOY_NID_PATH?.trim() || DEFAULT_NID_PATH;
  const base = new URL(rawBase);

  if (base.protocol !== "https:") {
    throw new PorichoyError(
      "Porichoy URL must use HTTPS.",
      503,
      "PORICHOY_BAD_CONFIG",
    );
  }

  const allowCustomHost = process.env.PORICHOY_ALLOW_CUSTOM_HOST === "1";
  if (!allowCustomHost && base.hostname !== "api.porichoybd.com") {
    throw new PorichoyError(
      "Porichoy host is not approved by configuration.",
      503,
      "PORICHOY_BAD_CONFIG",
    );
  }

  return `${base.toString().replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

export function porichoyConfigured(): boolean {
  return enabled() && Boolean(apiKey());
}

export async function verifyNidWithPorichoy(input: NidLookupRequest) {
  if (!enabled()) {
    throw new PorichoyError(
      "Porichoy integration is disabled.",
      503,
      "PORICHOY_DISABLED",
    );
  }

  const key = apiKey();
  if (!key) {
    throw new PorichoyError(
      "Porichoy API key is not configured.",
      503,
      "PORICHOY_NOT_CONFIGURED",
    );
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(
    3000,
    Number(process.env.PORICHOY_TIMEOUT_MS || 15000),
  );
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify({
        nidNumber: input.nidNumber,
        dateOfBirth: input.dateOfBirth,
        englishTranslation: true,
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    const rawText = await response.text();
    const data = parseBody(rawText);

    if (!response.ok) {
      const status =
        response.status === 429
          ? 429
          : response.status >= 500
            ? 503
            : response.status === 401 || response.status === 403
              ? 502
              : 422;

      const message =
        response.status === 401 || response.status === 403
          ? "Porichoy rejected the configured credential."
          : response.status === 429
            ? "Porichoy rate limit reached."
            : response.status >= 500
              ? "Porichoy is temporarily unavailable."
              : "Porichoy could not verify this record.";

      throw new PorichoyError(
        message,
        status,
        "PORICHOY_UPSTREAM_ERROR",
        response.status,
      );
    }

    return {
      status: response.status,
      durationMs: Date.now() - startedAt,
      data,
    };
  } catch (error) {
    if (error instanceof PorichoyError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new PorichoyError(
        "Porichoy request timed out.",
        504,
        "PORICHOY_TIMEOUT",
      );
    }

    throw new PorichoyError(
      "Porichoy cannot be reached from this deployment.",
      503,
      "PORICHOY_NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timer);
  }
}
