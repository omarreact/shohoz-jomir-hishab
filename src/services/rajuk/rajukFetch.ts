import "server-only";

/** Shared upstream fetch with timeout + retries (helps when RAJUK path is flaky). */
export async function fetchWithRetry(
  url: string,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {},
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? 20_000;
  const retries = init.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          accept: "application/json",
          referer: "https://masterplan.rajuk.gov.bd/",
          origin: "https://masterplan.rajuk.gov.bd",
          ...(init.headers || {}),
        },
      });
      // Retry transient upstream errors
      if (response.status >= 500 && attempt < retries) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Upstream fetch failed");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
