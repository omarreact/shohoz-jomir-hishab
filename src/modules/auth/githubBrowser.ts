/**
 * Browser capability decisions for Firebase GitHub OAuth.
 * Same-origin redirect requires the Firebase helper rewrites AND a matching
 * GitHub OAuth callback URL; never silently change authDomain at runtime.
 */
export function isMobileUserAgent(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

export function isEmbeddedBrowser(userAgent: string): boolean {
  return /(?:\bwv\b|; wv\)|FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|TikTok|BytedanceWebview|Snapchat|ChatGPT|GSA\/|MicroMessenger)/i.test(userAgent);
}

export type GithubSignInStrategy = "popup" | "redirect" | "external-browser";

export function githubSignInStrategy(options: {
  userAgent: string;
  hostname: string;
  authDomain: string | undefined;
}): GithubSignInStrategy {
  if (!isMobileUserAgent(options.userAgent)) return "popup";

  const authDomain = options.authDomain?.toLowerCase().trim();
  const hostname = options.hostname.toLowerCase().trim();
  if (authDomain && hostname && authDomain === hostname) return "redirect";

  // A Firebase-hosted cross-origin redirect can silently fail in modern
  // mobile browsers; embedded browsers also routinely block OAuth popups.
  if (isEmbeddedBrowser(options.userAgent)) return "external-browser";

  return "popup";
}

/** Android user-initiated link to open the exact login URL in Chrome. */
export function androidChromeIntent(loginUrl: string): string | null {
  try {
    const url = new URL(loginUrl);
    if (url.protocol !== "https:" || url.hostname !== "landbd.pincodeit.com") return null;
    const path = `${url.pathname}${url.search}`;
    return `intent://${url.host}${path}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url.toString())};end`;
  } catch {
    return null;
  }
}
