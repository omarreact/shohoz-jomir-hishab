import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";
import { FirebaseResponseSchema } from "@/src/types/external";
import { ApiError } from "@/src/shared/utils/errors";

export class FirebaseProvider extends BaseProvider {
  public readonly name: string; public readonly type = "Firebase"; private readonly collectionName: string; private readonly documentId: string;
  constructor(name: string, collectionName: string, documentId: string) { super(); this.name = name; this.collectionName = collectionName; this.documentId = documentId; }
  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> { try { const { db } = await import("@/src/modules/database/firebaseAdmin"); if (!db) throw new Error("Firebase Admin SDK not initialized"); const docSnap = await db.collection(this.collectionName).doc(this.documentId).get(); if (!docSnap.exists) return []; return this.normalize(docSnap.data()); } catch (error: unknown) { throw new ApiError(`Firebase Error: ${error instanceof Error ? error.message : "unknown error"}`, 500); } }
  public normalize(rawData: unknown): UnifiedFeature[] { const data = FirebaseResponseSchema.parse(rawData); if (data.data && Array.isArray(data.data)) return data.data.map((item, index) => ({ id: item.id || `fb-${this.name}-${index}`, properties: item, metadata: { layerId: this.name, source: "Firebase" } })) as UnifiedFeature[]; const recordData = data as Record<string, unknown>; return [{ id: (recordData.id as string) || `fb-${this.name}-doc`, properties: recordData, metadata: { layerId: this.name, source: "Firebase" } }] as UnifiedFeature[]; }
}
