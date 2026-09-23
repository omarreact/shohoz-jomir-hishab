export type WardOption = {
  id: string;
  label: string;
  zoneId: string;
};

export type ZoneRecord = {
  id: string;
  name: string;
};

export type AuthorityRecord = {
  ward: string;
  zoneId: string;
  officerName: string;
  officerTitle: string;
  councillorName: string;
  councillorTitle: string;
};

const zoneForWard = (wardNumber: number): string => {
  // Development-only fallback mapping. Ward 44 -> Zone 09 is intentionally
  // preserved from the DNCC v8 workflow example supplied for this feature.
  if (wardNumber === 44) return "09";
  const zone = Math.min(10, Math.max(1, Math.floor((wardNumber - 1) / 6) + 1));
  return String(zone).padStart(2, "0");
};

export const MOCK_WARDS: WardOption[] = Array.from({ length: 54 }, (_, index) => {
  const ward = String(index + 1).padStart(2, "0");
  return {
    id: ward,
    label: `ওয়ার্ড ${ward}`,
    zoneId: zoneForWard(index + 1),
  };
});

export const MOCK_ZONES: ZoneRecord[] = Array.from({ length: 10 }, (_, index) => {
  const id = String(index + 1).padStart(2, "0");
  return { id, name: `অঞ্চল ${id}` };
});

export function getZoneForWard(ward: string): ZoneRecord | null {
  const normalized = ward.padStart(2, "0");
  const wardRecord = MOCK_WARDS.find((item) => item.id === normalized);
  if (!wardRecord) return null;
  return MOCK_ZONES.find((zone) => zone.id === wardRecord.zoneId) ?? null;
}

export function getAuthorityForWard(ward: string, zoneId: string): AuthorityRecord | null {
  const normalizedWard = ward.padStart(2, "0");
  const zone = getZoneForWard(normalizedWard);
  if (!zone || zone.id !== zoneId) return null;

  return {
    ward: normalizedWard,
    zoneId,
    officerName: "মোঃ নমুনা আঞ্চলিক নির্বাহী কর্মকর্তা",
    officerTitle: `আঞ্চলিক নির্বাহী কর্মকর্তা, অঞ্চল-${zoneId}`,
    councillorName: `মোঃ নমুনা কাউন্সিলর (ওয়ার্ড ${normalizedWard})`,
    councillorTitle: `কাউন্সিলর, ওয়ার্ড নং ${normalizedWard}`,
  };
}
