export async function readApiResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `API returned an empty response (HTTP ${response.status}). Please try again.`,
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    const preview = text.replace(/\s+/g, " ").slice(0, 180);
    throw new Error(
      `API returned HTML/non-JSON (HTTP ${response.status}). ${preview || "The server did not return JSON."}`,
    );
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error(`API returned invalid JSON (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: unknown }).message || "Request failed")
        : `Request failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  return data;
}
