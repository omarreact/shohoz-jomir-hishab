import "server-only";

import {
  PINPAY_PROVIDERS,
  type PinPayMethod,
  type PinPayProvider,
  type PinPaySettings,
} from "../types";

const EMPTY_METHOD: PinPayMethod = {
  enabled: false,
  approved: false,
  receiver: "",
  accountLabel: "",
};

export function defaultPinPaySettings(): PinPaySettings {
  return {
    enabled: false,
    methods: {
      bkash: { ...EMPTY_METHOD },
      nagad: { ...EMPTY_METHOD },
      rocket: { ...EMPTY_METHOD },
      upay: { ...EMPTY_METHOD },
      bank: { ...EMPTY_METHOD },
    },
  };
}

export function validateMethod(provider: PinPayProvider, method: PinPayMethod): boolean {
  if (!method.enabled || !method.approved) return false;
  if (provider === "bank") {
    return method.receiver.trim().length >= 6 && method.accountLabel.trim().length >= 3;
  }
  return /^01[3-9]\d{8}$/.test(method.receiver) && method.accountLabel.trim().length >= 2;
}

async function readPinPaySettingsData(): Promise<Record<string, unknown> | null> {
  if (process.env.LANDBD_PLATFORM === "cloudflare-workers") {
    const { adminGetFirestoreDocument, hasFirebaseRestAdminCredentials } = await import(
      "@/src/modules/database/firebaseRest"
    );
    if (!hasFirebaseRestAdminCredentials()) throw new Error("PinPay settings unavailable");
    return adminGetFirestoreDocument("landbdPrivateConfig/pinpay");
  }
  const { db } = await import("@/src/modules/database/firebaseAdmin");
  const snapshot = await db.collection("landbdPrivateConfig").doc("pinpay").get();
  return snapshot.exists ? (snapshot.data() ?? {}) : null;
}

export async function getPinPaySettings(): Promise<PinPaySettings> {
  const fallback = defaultPinPaySettings();
  const data = await readPinPaySettingsData();
  if (!data) return fallback;
  const methodData = data.methods && typeof data.methods === "object" ? data.methods as Record<string, unknown> : {};
  for (const provider of PINPAY_PROVIDERS) {
    const raw = methodData[provider] as Record<string, unknown> | undefined;
    if (!raw) continue;
    fallback.methods[provider] = {
      enabled: raw.enabled === true,
      approved: raw.approved === true,
      receiver: typeof raw.receiver === "string" ? raw.receiver : "",
      accountLabel: typeof raw.accountLabel === "string" ? raw.accountLabel : "",
    };
  }
  fallback.enabled = data.enabled === true;
  fallback.updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : undefined;
  return fallback;
}

export async function savePinPaySettings(settings: PinPaySettings, actorId: string): Promise<void> {
  // Never enable a provider with an unapproved collection account.
  for (const provider of PINPAY_PROVIDERS) {
    const method = settings.methods[provider];
    if (method.enabled && !validateMethod(provider, method)) {
      throw new Error(provider + " receiving account must be approved and valid before enabling");
    }
  }
  if (settings.enabled && !PINPAY_PROVIDERS.some(p => validateMethod(p, settings.methods[p]))) {
    throw new Error("Activate at least one approved receiving account");
  }
  const data = {
    enabled: settings.enabled,
    methods: settings.methods,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  };
  if (process.env.LANDBD_PLATFORM === "cloudflare-workers") {
    const { adminSetFirestoreDocument, hasFirebaseRestAdminCredentials } = await import(
      "@/src/modules/database/firebaseRest"
    );
    if (!hasFirebaseRestAdminCredentials()) throw new Error("PinPay settings unavailable");
    await adminSetFirestoreDocument("landbdPrivateConfig/pinpay", data);
    return;
  }
  const { db } = await import("@/src/modules/database/firebaseAdmin");
  await db.collection("landbdPrivateConfig").doc("pinpay").set(data);
}

export function availablePinPayMethods(settings: PinPaySettings): PinPayProvider[] {
  if (!settings.enabled) return [];
  return PINPAY_PROVIDERS.filter(provider => validateMethod(provider, settings.methods[provider]));
}
