export interface TokenResult {
  token: string;
  expires: number;
}

export interface TokenProvider {
  getToken(): Promise<TokenResult>;
}

export interface CacheProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}
