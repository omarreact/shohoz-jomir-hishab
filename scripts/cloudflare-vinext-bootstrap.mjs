/** Staging-only initial Worker used to register a Wrangler-managed script for vinext. */
export default {
  async fetch() {
    return new Response("LandBD vinext canary is initializing.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  },
};
