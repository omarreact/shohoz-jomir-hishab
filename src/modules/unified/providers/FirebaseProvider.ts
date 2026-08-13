import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";
import { FirebaseResponseSchema } from "@/src/types/rajuk";
import { ApiError } from "@/src/shared/utils/errors";

export class FirebaseProvider extends BaseProvider {
  public readonly name: string;
  public readonly type = "Firebase";
  private readonly collectionName: string;
  private readonly documentId: string;

  constructor(name: string, collectionName: string, documentId: string) {
    super();
    this.name = name;
    this.collectionName = collectionName;
    this.documentId = documentId;
  }

  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("@/src/modules/database/firebaseClient");
      
      const docRef = doc(db, this.collectionName, this.documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return [];
      }
      
      const rawData = docSnap.data();
      return this.normalize(rawData);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ApiError(`Firebase Error: ${error.message}`, 500);
      }
      throw new ApiError("Firebase Error", 500);
    }
  }

  public normalize(rawData: unknown): UnifiedFeature[] {
    const data = FirebaseResponseSchema.parse(rawData);
    
    // If it's the specific format for porcha JSON containing an array of records
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((item, index) => ({
        id: item.id || `fb-${this.name}-${index}`,
        properties: item,
        metadata: {
          layerId: this.name,
          source: "Firebase",
        }
      })) as UnifiedFeature[];
    }

    // Otherwise treat the whole doc as one feature
    const recordData = data as Record<string, unknown>;
    return [{
      id: (recordData.id as string) || `fb-${this.name}-doc`,
      properties: recordData,
      metadata: {
        layerId: this.name,
        source: "Firebase",
      }
    }] as UnifiedFeature[];
  }
}
