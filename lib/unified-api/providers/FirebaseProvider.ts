import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";

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
      const { db } = await import("@/lib/firebase");
      
      const docRef = doc(db, this.collectionName, this.documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return [];
      }
      
      const rawData = docSnap.data();
      return this.normalize(rawData) as UnifiedFeature[];
    } catch (error: any) {
      throw new Error(`Firebase Error: ${error.message}`);
    }
  }

  public normalize(rawData: any): UnifiedFeature[] {
    // If it's the specific format for porcha JSON containing an array of records
    if (rawData && rawData.data && Array.isArray(rawData.data)) {
      return rawData.data.map((item: any, index: number) => ({
        id: item.id || `fb-${this.name}-${index}`,
        properties: item,
        metadata: {
          layerId: this.name,
          source: "Firebase",
        }
      }));
    }

    // Otherwise treat the whole doc as one feature
    return [{
      id: rawData.id || `fb-${this.name}-doc`,
      properties: rawData,
      metadata: {
        layerId: this.name,
        source: "Firebase",
      }
    }];
  }
}
