export enum AuthState {
  PUBLIC = "PUBLIC",
  TOKEN_CHECKING = "TOKEN_CHECKING",
  TOKEN_VALID = "TOKEN_VALID",
  TOKEN_INVALID = "TOKEN_INVALID",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_ERROR = "TOKEN_ERROR",
  PRIVATE_UNAVAILABLE = "PRIVATE_UNAVAILABLE",
}

export class TokenManager {
  private static instance: TokenManager;
  private activeToken: string = "";
  private lastFetched: number = 0;
  private readonly TOKEN_TTL = 1000 * 60 * 60 * 24; // 24 hours assuming long-lived tokens
  private authState: AuthState = AuthState.PUBLIC;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public getAuthState(): AuthState {
    return this.authState;
  }

  public reportTokenFailure(statusCode: number) {
    if (statusCode === 498 || statusCode === 499) {
      this.authState = AuthState.TOKEN_INVALID;
      this.activeToken = ""; // Clear invalid token
    } else {
      this.authState = AuthState.TOKEN_ERROR;
    }
  }

  public async getToken(): Promise<string> {
    // If we already know the token is invalid and we haven't hit TTL to try again, just return empty
    if (this.authState === AuthState.TOKEN_INVALID || this.authState === AuthState.PRIVATE_UNAVAILABLE) {
      return "";
    }

    if (this.activeToken && Date.now() - this.lastFetched < this.TOKEN_TTL) {
      this.authState = AuthState.TOKEN_VALID;
      return this.activeToken;
    }
    
    this.authState = AuthState.TOKEN_CHECKING;
    return this.refreshToken();
  }

  public async refreshToken(): Promise<string> {
    try {
      // Lazy load firebase admin/firestore to keep edge compatible if possible
      // Only do this if Firebase is configured
      const fbProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      let fbToken = "";
      if (fbProjectId && fbProjectId !== 'your-project-id' && !fbProjectId.startsWith('your-')) {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/src/modules/database/firebaseClient");
        
        const docRef = doc(db, "config", "rajuk_api");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().token) {
          fbToken = docSnap.data().token;
        }
      }
      
      // If .env has a token, we prioritize it during local dev/debugging. 
      // Otherwise use Firebase.
      const envToken = process.env.RAJUK_MAP_TOKEN;
      
      if (envToken) {
        this.activeToken = envToken;
        this.lastFetched = Date.now();
        this.authState = AuthState.TOKEN_VALID;
      } else if (fbToken) {
        this.activeToken = fbToken;
        this.lastFetched = Date.now();
        this.authState = AuthState.TOKEN_VALID;
      } else {
        this.activeToken = "";
        this.authState = AuthState.PRIVATE_UNAVAILABLE;
      }
    } catch (error) {
      console.error("TokenManager: Failed to refresh token", error);
      this.activeToken = process.env.RAJUK_MAP_TOKEN || "";
      this.authState = this.activeToken ? AuthState.TOKEN_VALID : AuthState.TOKEN_ERROR;
    }
    
    return this.activeToken;
  }
}
