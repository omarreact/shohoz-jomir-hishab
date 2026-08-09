import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";

/**
 * Legacy FirebaseProvider stub.
 * Firebase has been completely replaced by the Next.js SQLite backend.
 */
export class FirebaseProvider extends BaseProvider {
  public readonly name: string;
  public readonly type = "Firebase";

  constructor(name: string, _collectionName: string, _documentId: string) {
    super();
    this.name = name;
  }

  public async fetch(_query: ProviderQuery): Promise<UnifiedFeature[]> {
    return [];
  }

  public normalize(_rawData: unknown): UnifiedFeature[] {
    return [];
  }
}
