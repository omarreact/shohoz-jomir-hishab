import {
  androidChromeIntent,
  githubSignInStrategy,
  isEmbeddedBrowser,
  isMobileUserAgent,
} from "./githubBrowser";

describe("GitHub OAuth mobile browser decision", () => {
  const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/122 Mobile Safari/537.36";
  const embedded = "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 Chrome/122 Mobile Safari/537.36";
  const desktop = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36";

  test("recognizes mobile and embedded browsers without treating Chrome as embedded", () => {
    expect(isMobileUserAgent(android)).toBe(true);
    expect(isMobileUserAgent(desktop)).toBe(false);
    expect(isEmbeddedBrowser(embedded)).toBe(true);
    expect(isEmbeddedBrowser(android)).toBe(false);
  });

  test("chooses full-page redirect only with a matching same-origin auth helper", () => {
    expect(githubSignInStrategy({
      userAgent: android,
      hostname: "landbd.pincodeit.com",
      authDomain: "landbd.pincodeit.com",
    })).toBe("redirect");
  });

  test("does not trigger blocked popup within an embedded cross-origin browser", () => {
    expect(githubSignInStrategy({
      userAgent: embedded,
      hostname: "landbd.pincodeit.com",
      authDomain: "smart-khotiyan.firebaseapp.com",
    })).toBe("external-browser");
  });

  test("keeps desktop and ordinary Chrome popup behavior until callback migration", () => {
    expect(githubSignInStrategy({ userAgent: desktop, hostname: "landbd.pincodeit.com", authDomain: undefined })).toBe("popup");
    expect(githubSignInStrategy({ userAgent: android, hostname: "landbd.pincodeit.com", authDomain: "smart-khotiyan.firebaseapp.com" })).toBe("popup");
  });

  test("Chrome launch intent retains the intended login URL", () => {
    const source = "https://landbd.pincodeit.com/login?from=%2Fadmin";
    const result = androidChromeIntent(source);
    expect(result).toContain("intent://landbd.pincodeit.com/login?from=%2Fadmin#Intent");
    expect(result).toContain("package=com.android.chrome");
    expect(androidChromeIntent("https://evil.example/login")).toBeNull();
    expect(androidChromeIntent("javascript:alert(1)")).toBeNull();
  });
});
