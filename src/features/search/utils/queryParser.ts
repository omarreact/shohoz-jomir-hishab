/**
 * Parses user input to classify intent and extract searchable parameters
 * for the unified smart search API.
 */

export type QueryIntent = 
  | "COORDINATE"
  | "GOOGLE_MAPS_URL"
  | "NID"
  | "KHATIAN"
  | "PLOT_NO"
  | "TEXT"
  | "UNKNOWN";

export interface ParsedQuery {
  intent: QueryIntent;
  originalQuery: string;
  normalizedQuery: string;
  extracted?: any; // Contains coords, specific IDs, etc.
}

const REGEX = {
  // Matches "23.8103, 90.4125" or "23.8103 90.4125"
  COORDINATE: /^([-+]?([1-8]?\d(\.\d+)?|90(\.0+)?))\s*,\s*([-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?))$/,
  // Matches 10, 13, or 17 digits
  NID: /^(\d{10}|\d{13}|\d{17})$/,
  // Simple check for google maps links
  GOOGLE_MAPS: /goo\.gl\/maps|maps\.app\.goo\.gl|google\.com\/maps/,
  // Matches "RS-123", "CS 45", "MS 999", "1234" (just a number could be plot)
  PLOT: /^(RS|CS|MS|SA|BS|BSRS)?\s*[-]?\s*(\d+)$/i,
  // Matches Khatian explicitly
  KHATIAN: /^(KHATIAN|KH|খতিয়ান)\s*[-]?\s*(\d+)$/i
};

export function parseSearchQuery(query: string): ParsedQuery {
  const q = query.trim();
  const upperQ = q.toUpperCase();

  // 1. Google Maps URL
  if (REGEX.GOOGLE_MAPS.test(q)) {
    return { intent: "GOOGLE_MAPS_URL", originalQuery: q, normalizedQuery: q };
  }

  // 2. Coordinates (Lat, Lng)
  const coordMatch = q.match(REGEX.COORDINATE);
  if (coordMatch) {
    return {
      intent: "COORDINATE",
      originalQuery: q,
      normalizedQuery: q,
      extracted: {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[5])
      }
    };
  }

  // 3. NID
  if (REGEX.NID.test(q)) {
    return { intent: "NID", originalQuery: q, normalizedQuery: q };
  }

  // 4. Khatian
  const khatianMatch = q.match(REGEX.KHATIAN);
  if (khatianMatch) {
    return { 
      intent: "KHATIAN", 
      originalQuery: q, 
      normalizedQuery: q,
      extracted: { khatianNo: khatianMatch[2] }
    };
  }

  // 5. Plot No (Explicit or implicit number)
  const plotMatch = q.match(REGEX.PLOT);
  if (plotMatch) {
    return {
      intent: "PLOT_NO",
      originalQuery: q,
      normalizedQuery: q,
      extracted: {
        surveyType: plotMatch[1]?.toUpperCase() || "UNKNOWN",
        plotNo: plotMatch[2]
      }
    };
  }

  // Fallback: Text (Address, Name, Location)
  return {
    intent: "TEXT",
    originalQuery: q,
    normalizedQuery: upperQ,
  };
}
