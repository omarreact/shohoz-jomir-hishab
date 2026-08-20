/** Browser-side fetch with retries — helps flaky WiFi to our own API. */
export async function fetchRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(input, { ...init, cache: "no-store" });
      // Retry transient server errors
      if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}
