export class TokenManager {
  private static instance: TokenManager;
  private activeToken: string = "";
  private lastFetched: number = 0;
  private readonly TOKEN_TTL = 1000 * 60 * 60 * 24; // 24 hours assuming long-lived tokens

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public async getToken(): Promise<string> {
    if (this.activeToken && Date.now() - this.lastFetched < this.TOKEN_TTL) {
      return this.activeToken;
    }
    return this.refreshToken();
  }

  public async refreshToken(): Promise<string> {
    try {
      // Lazy load firebase admin/firestore to keep edge compatible if possible
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      
      const docRef = doc(db, "config", "rajuk_api");
      const docSnap = await getDoc(docRef);
      
      // If .env.local has a token, we prioritize it during local dev/debugging. 
      // Otherwise use Firebase.
      const envToken = process.env.RAJUK_MAP_TOKEN;
      
      if (envToken) {
        this.activeToken = envToken;
        this.lastFetched = Date.now();
      } else if (docSnap.exists() && docSnap.data().token) {
        this.activeToken = docSnap.data().token;
        this.lastFetched = Date.now();
      }
    } catch (error) {
      console.error("TokenManager: Failed to refresh token from Firebase", error);
      this.activeToken = process.env.RAJUK_MAP_TOKEN || "";
    }
    
    return this.activeToken;
  }
}
