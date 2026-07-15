export class CoordinateService {
  /**
   * Format latitude and longitude to Decimal Degrees
   */
  public static formatDD(lat: number, lng: number, fractionDigits = 5): string {
    return `${lat.toFixed(fractionDigits)}°, ${lng.toFixed(fractionDigits)}°`;
  }

  /**
   * Format latitude and longitude to Degrees, Minutes, Seconds (DMS)
   */
  public static formatDMS(lat: number, lng: number): string {
    const toDMS = (coord: number, isLat: boolean) => {
      const absolute = Math.abs(coord);
      const degrees = Math.floor(absolute);
      const minutesNotTruncated = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesNotTruncated);
      const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
      let direction = "";
      if (isLat) {
        direction = coord >= 0 ? "N" : "S";
      } else {
        direction = coord >= 0 ? "E" : "W";
      }
      return `${degrees}°${minutes}'${seconds}"${direction}`;
    };

    return `${toDMS(lat, true)}, ${toDMS(lng, false)}`;
  }

  /**
   * Stub for projecting coordinates (if proj4js is needed later)
   * Currently just returns the same coordinates assuming WGS84
   */
  public static project(point: { lat: number; lng: number }, fromSR: string, toSR: string): { lat: number; lng: number } {
    if (fromSR === toSR) return point;
    // TODO: implement full projection logic via proj4 if needed.
    return point;
  }
}
