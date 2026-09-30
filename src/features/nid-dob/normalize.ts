import {
  NormalizedNidRecordSchema,
  type NidAddress,
  type NormalizedNidRecord,
} from "./schema";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : null;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function pick(source: AnyRecord | null, ...keys: string[]): unknown {
  if (!source) return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  return undefined;
}

function normalizeDate(value: unknown): string | null {
  const valueText = firstText(value);
  if (!valueText) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(valueText)) return valueText;

  const slash = valueText.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;

  return valueText;
}

function normalizeUrl(value: unknown): string | null {
  const valueText = firstText(value);
  if (!valueText) return null;
  try {
    const url = new URL(valueText);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

const emptyAddress = (): NidAddress => ({
  division: null,
  district: null,
  upazila: null,
  rmo: null,
  city: null,
  union: null,
  mouza: null,
  ward: null,
  village: null,
  house: null,
  postOffice: null,
  postCode: null,
  voterArea: null,
  addressLine: null,
});

function normalizeAddress(value: unknown): NidAddress {
  const source = asRecord(value);
  if (!source) {
    const addressLine = firstText(value);
    return { ...emptyAddress(), addressLine };
  }

  return {
    division: firstText(pick(source, "division", "divisionName")),
    district: firstText(pick(source, "district", "districtName")),
    upazila: firstText(pick(source, "upazila", "upazilla", "thana", "upazilaName")),
    rmo: firstText(pick(source, "rmo")),
    city: firstText(pick(source, "city", "cityCorporation")),
    union: firstText(pick(source, "union", "unionOrWard")),
    mouza: firstText(pick(source, "mouza", "mouzaOrMoholla", "mouzaOrMahalla")),
    ward: firstText(pick(source, "ward")),
    village: firstText(pick(source, "village", "villageOrRoad")),
    house: firstText(pick(source, "house", "houseOrHoldingNo", "holding")),
    postOffice: firstText(pick(source, "post_office", "postOffice")),
    postCode: firstText(pick(source, "post_code", "postCode")),
    voterArea: firstText(pick(source, "voter_area", "voterArea")),
    addressLine: firstText(
      pick(source, "address_line", "addressLine", "fullAddress", "address"),
    ),
  };
}

export function normalizeNidResponse(raw: unknown): NormalizedNidRecord {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? root;
  const nested = asRecord(data.data) ?? data;
  const citizen = asRecord(nested.citizenData) ?? asRecord(nested.person) ?? nested;

  const presentAddress =
    pick(citizen, "present_address", "presentAddress", "presentHouseholdNo") ??
    pick(nested, "present_address", "presentAddress", "presentHouseholdNo");

  const permanentAddress =
    pick(citizen, "permanent_address", "permanentAddress", "permanentHouseholdNo") ??
    pick(nested, "permanent_address", "permanentAddress", "permanentHouseholdNo");

  const normalized: NormalizedNidRecord = {
    nidNumber: firstText(
      pick(citizen, "nid_number", "nidNumber", "national_id", "citizen_nid", "nid"),
      pick(nested, "nid_number", "nidNumber", "national_id"),
    ),
    nameBn: firstText(
      pick(citizen, "name_bn", "fullName_Bangla", "fullNameBangla", "nameBangla"),
    ),
    nameEn: firstText(
      pick(
        citizen,
        "name_en",
        "fullName_English",
        "fullNameEnglish",
        "nameEnglish",
        "person_fullname",
        "name",
      ),
    ),
    gender: firstText(pick(citizen, "gender")),
    bloodGroup: firstText(pick(citizen, "blood_group", "bloodGroup")),
    religion: firstText(pick(citizen, "religion")),
    dateOfBirth: normalizeDate(
      pick(citizen, "dob", "dateOfBirth", "date_of_birth", "person_dob"),
    ),
    birthPlace: firstText(pick(citizen, "birth_place", "birthPlace")),
    birthRegistration: firstText(
      pick(citizen, "birth_reg", "birthRegistration", "bin_BRN", "brn"),
    ),
    mobile: firstText(pick(citizen, "mobile", "mobileNumber", "phone")),
    email: firstText(pick(citizen, "email")),
    education: firstText(pick(citizen, "education")),
    occupation: firstText(pick(citizen, "occupation", "profession")),
    maritalStatus: firstText(pick(citizen, "marital_status", "maritalStatus")),
    fatherName: firstText(
      pick(citizen, "father_name", "fatherName", "fatherName_Bangla", "fatherName_English"),
    ),
    fatherNid: firstText(pick(citizen, "father_nid", "fatherNid")),
    motherName: firstText(
      pick(citizen, "mother_name", "motherName", "motherName_Bangla", "motherName_English"),
    ),
    motherNid: firstText(pick(citizen, "mother_nid", "motherNid")),
    spouseName: firstText(pick(citizen, "spouse_name", "spouseName")),
    spouseNid: firstText(pick(citizen, "spouse_nid", "spouseNid")),
    tin: firstText(pick(citizen, "tin")),
    passport: firstText(pick(citizen, "passport")),
    drivingLicense: firstText(
      pick(citizen, "driving_license", "drivingLicense"),
    ),
    disability: firstText(pick(citizen, "disability", "disabilityStatus")),
    identificationMark: firstText(
      pick(citizen, "id_mark", "identificationMark", "identification_mark"),
    ),
    voterArea: firstText(pick(citizen, "voter_area", "voterArea")),
    homeDescription: firstText(
      pick(
        citizen,
        "home_description",
        "homeDescription",
        "presentHouseholdNoText",
        "permanentHouseholdNoText",
      ),
    ),
    presentAddress: normalizeAddress(presentAddress),
    permanentAddress: normalizeAddress(permanentAddress),
    photoUrl: normalizeUrl(
      pick(citizen, "photo_url", "photoUrl", "photo", "photoURL"),
    ),
  };

  return NormalizedNidRecordSchema.parse(normalized);
}
