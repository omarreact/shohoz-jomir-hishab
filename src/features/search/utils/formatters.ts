export const engToBdNum = (str: any): string => {
  if (str === null || str === undefined || str === "") return "-";
  const map: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };
  return String(str).replace(/[0-9]/g, (d) => map[d] || d);
};

const keyTranslations: Record<string, string> = {
  mDistrict: "জেলা",
  upazilaPs: "থানা",
  mauza: "মৌজা",
  plotTypeCustom: "দাগের ধরন",
  landuse: "ভূমি ব্যবহার (Landuse)",
  areaKatha: "প্লট এরিয়া (কাঠা)",
  areaAcre: "আয়তন (একর)",
  remarks: "মন্তব্য",
  zone: "জোন",
  subzone: "সাবজোন",
  dapZone: "ড্যাপ জোন",
  area: "ভূমির পরিমাণ (Shape Area)",
  address: "ঠিকানা (Address)",
  rsPlotNumber: "আরএস (RS) দাগ",
  msPlotNumber: "এমএস (MS) দাগ",
  plotNumber: "দাগ নম্বর",
  distMs: "জেলা (MS)",
  thanaMs: "থানা (MS)",
  thana: "থানা",
  jlNo: "জেএল (JL) নম্বর",
  sheetNo: "শীট নম্বর",
  plotType: "প্লট টাইপ",
  maximumHe: "সর্বোচ্চ উচ্চতা",
  far: "ফার (FAR)",
  rajukZone: "রাজউক জোন",
  rajukSubzone: "রাজউক সাবজোন",
  regionNameEn: "অঞ্চলের নাম (ইংরেজি)",
  regionNameBn: "অঞ্চলের নাম (বাংলা)",
  length: "সীমানার দৈর্ঘ্য",
};

export const IGNORED_KEYS = ["id", "objectid", "globalid", "shape", "landusedata", "flooddata", "p_guid", "p_guid_1", "t_guid", "d_guid", "m_guid"];

export const formatKeyName = (key: string): string => {
  return keyTranslations[key] || key.replace(/([A-Z])/g, " $1").toUpperCase();
};

export const formatValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === "") return "-";
  let strVal = String(value);
  if (["mDistrict", "upazilaPs", "mauza", "plotTypeCustom"].includes(key)) {
    return strVal;
  }
  if (["areaAcre", "area", "length", "far", "areaKatha"].includes(key)) {
    const num = parseFloat(strVal);
    if (!isNaN(num)) strVal = num.toFixed(4);
  }
  return engToBdNum(strVal);
};
