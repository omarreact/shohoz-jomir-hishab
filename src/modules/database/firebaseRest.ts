import "server-only";

import { importPKCS8, SignJWT } from "jose";

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { stringValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

let accessTokenCache: { token: string; expiresAt: number } | null = null;

function projectId(): string {
  const value =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!value) throw new Error("Firebase project ID is not configured");
  return value;
}

function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) throw new Error("Firebase service-account private key is not configured");
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  value = value.replace(/\\n/g, "\n");
  if (
    !value.includes("-----BEGIN PRIVATE KEY-----") ||
    !value.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error("Firebase service-account private key is invalid");
  }
  return value;
}

function serviceAccountEmail(): string {
  const value = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  if (!value) throw new Error("Firebase service-account email is not configured");
  return value;
}

export function hasFirebaseRestAdminCredentials(): boolean {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

async function googleAccessToken(): Promise<string> {
  const nowMs = Date.now();
  if (accessTokenCache && accessTokenCache.expiresAt - 60_000 > nowMs) {
    return accessTokenCache.token;
  }

  const email = serviceAccountEmail();
  const key = await importPKCS8(normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY), "RS256");
  const now = Math.floor(nowMs / 1000);
  const assertion = await new SignJWT({
    scope:
      "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(email)
    .setSubject(email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google service-account token exchange failed (${response.status})`);
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) throw new Error("Google service-account token exchange returned no token");

  accessTokenCache = {
    token: body.access_token,
    expiresAt: nowMs + Math.max(300, Number(body.expires_in) || 3600) * 1000,
  };
  return body.access_token;
}

function firestoreBase(): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId())}/databases/(default)/documents`;
}

function documentUrl(path: string): string {
  const encoded = path
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${firestoreBase()}/${encoded}`;
}

export function decodeFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if ("arrayValue" in value)
    return (value.arrayValue.values ?? []).map((item) => decodeFirestoreValue(item));
  if ("mapValue" in value) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value.mapValue.fields ?? {})) {
      result[key] = decodeFirestoreValue(nested);
    }
    return result;
  }
  return undefined;
}

export function decodeFirestoreDocument(
  document: FirestoreDocument | null | undefined,
): Record<string, unknown> | null {
  if (!document) return null;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(document.fields ?? {})) {
    result[key] = decodeFirestoreValue(value);
  }
  const name = document.name?.split("/").pop();
  if (name) result.id = name;
  if (document.createTime) result.__createTime = document.createTime;
  if (document.updateTime) result.__updateTime = document.updateTime;
  return result;
}

export function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => encodeFirestoreValue(item)) } };
  }
  if (typeof value === "object") {
    const fields: Record<string, FirestoreValue> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested !== undefined) fields[key] = encodeFirestoreValue(nested);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function encodeFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) fields[key] = encodeFirestoreValue(value);
  }
  return fields;
}

async function firestoreFetch(
  url: string,
  init: RequestInit = {},
  token?: string,
): Promise<Response> {
  const bearer = token || (await googleAccessToken());
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${bearer}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers, cache: "no-store" });
}

export async function getFirestoreDocument(
  path: string,
  options: { idToken?: string; allowMissing?: boolean } = {},
): Promise<Record<string, unknown> | null> {
  const response = await firestoreFetch(documentUrl(path), {}, options.idToken);
  if (response.status === 404 && options.allowMissing !== false) return null;
  if (!response.ok) {
    throw new Error(`Firestore document read failed (${response.status})`);
  }
  return decodeFirestoreDocument((await response.json()) as FirestoreDocument);
}

export async function adminGetFirestoreDocument(
  path: string,
): Promise<Record<string, unknown> | null> {
  return getFirestoreDocument(path, { allowMissing: true });
}

type QueryFilter =
  | { field: string; op: "EQUAL" | "IN"; value: unknown };

export async function adminQueryFirestore(
  collectionId: string,
  filters: QueryFilter[] = [],
  limit?: number,
): Promise<Record<string, unknown>[]> {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId }],
  };

  if (filters.length === 1) {
    const filter = filters[0];
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: filter.field },
        op: filter.op,
        value: encodeFirestoreValue(filter.value),
      },
    };
  } else if (filters.length > 1) {
    structuredQuery.where = {
      compositeFilter: {
        op: "AND",
        filters: filters.map((filter) => ({
          fieldFilter: {
            field: { fieldPath: filter.field },
            op: filter.op,
            value: encodeFirestoreValue(filter.value),
          },
        })),
      },
    };
  }

  if (limit && limit > 0) structuredQuery.limit = Math.floor(limit);

  const response = await firestoreFetch(
    `${firestoreBase()}:runQuery`,
    {
      method: "POST",
      body: JSON.stringify({ structuredQuery }),
    },
  );
  if (!response.ok) throw new Error(`Firestore query failed (${response.status})`);

  const rows = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  return rows
    .map((row) => decodeFirestoreDocument(row.document))
    .filter((row): row is Record<string, unknown> => Boolean(row));
}

export async function adminCreateFirestoreDocument(
  collectionId: string,
  data: Record<string, unknown>,
  documentId = crypto.randomUUID(),
): Promise<string> {
  const url = new URL(`${firestoreBase()}/${encodeURIComponent(collectionId)}`);
  url.searchParams.set("documentId", documentId);
  const response = await firestoreFetch(url.toString(), {
    method: "POST",
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!response.ok) throw new Error(`Firestore document create failed (${response.status})`);
  return documentId;
}

export async function adminSetFirestoreDocument(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  const response = await firestoreFetch(documentUrl(path), {
    method: "PATCH",
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (!response.ok) throw new Error(`Firestore document write failed (${response.status})`);
}

export async function lookupFirebaseAccount(idToken: string): Promise<{
  localId: string;
  disabled: boolean;
  validSince: number | null;
}> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) throw new Error("Firebase API key is not configured");
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Firebase account lookup failed (${response.status})`);
  const body = (await response.json()) as {
    users?: Array<{ localId?: string; disabled?: boolean; validSince?: string }>;
  };
  const user = body.users?.[0];
  if (!user?.localId) throw new Error("Unauthorized");
  const validSince = user.validSince ? Number(user.validSince) : null;
  return {
    localId: user.localId,
    disabled: user.disabled === true,
    validSince: Number.isFinite(validSince) ? validSince : null,
  };
}

export function clearFirebaseRestCachesForTest(): void {
  accessTokenCache = null;
}
