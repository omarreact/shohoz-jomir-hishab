export interface DiscoveredApi {
  id: string;
  name: string;
  url: string;
  method: string;
  host: string;
  serviceType: string;
  serviceName: string;
  layerId?: string;
  operation?: string;
  requiresToken: boolean;
  status: 'আবিষ্কৃত' | 'ইমপোর্ট করা হয়েছে' | 'ত্রুটি';
  source: 'HAR';
  contentType?: string;
}

export interface DiscoveredToken {
  id: string;
  type: 'arcgis' | 'bearer' | 'api_key' | 'unknown';
  source: 'HAR';
  host: string;
  maskedToken: string;
  tokenValue: string;
  firstSeen: string;
  lastSeen: string;
  associatedServices: string[];
  confidence: 'high' | 'medium' | 'low';
  status: 'বৈধ' | 'যাচাই করা হয়নি' | 'অবৈধ' | 'মেয়াদ শেষ' | 'যাচাই করা যায়নি';
}

export interface HarAnalysisSummary {
  totalRequests: number;
  rajukRequests: number;
  arcgisServices: number;
  mapServers: number;
  featureServers: number;
  queryEndpoints: number;
  legendEndpoints: number;
  tokensFound: number;
  uniqueApis: number;
}
