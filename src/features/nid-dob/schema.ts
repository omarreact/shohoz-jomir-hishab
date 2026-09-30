import { z } from "zod";

const NID_PATTERN = /^(?:\d{10}|\d{13}|\d{17})$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const NidLookupRequestSchema = z.object({
  nidNumber: z.preprocess(
    (value) => String(value ?? "").replace(/\D/g, ""),
    z.string().regex(NID_PATTERN, "NID must be 10, 13, or 17 digits."),
  ),
  dateOfBirth: z
    .string()
    .trim()
    .refine(isRealIsoDate, "Date of birth must be a valid YYYY-MM-DD date."),
  authorizedUse: z.literal(true, {
    error: "Lawful authorization/consent confirmation is required.",
  }),
});

export const NidAddressSchema = z.object({
  division: z.string().nullable(),
  district: z.string().nullable(),
  upazila: z.string().nullable(),
  rmo: z.string().nullable(),
  city: z.string().nullable(),
  union: z.string().nullable(),
  mouza: z.string().nullable(),
  ward: z.string().nullable(),
  village: z.string().nullable(),
  house: z.string().nullable(),
  postOffice: z.string().nullable(),
  postCode: z.string().nullable(),
  voterArea: z.string().nullable(),
  addressLine: z.string().nullable(),
});

export const NormalizedNidRecordSchema = z.object({
  nidNumber: z.string().nullable(),
  nameBn: z.string().nullable(),
  nameEn: z.string().nullable(),
  gender: z.string().nullable(),
  bloodGroup: z.string().nullable(),
  religion: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  birthPlace: z.string().nullable(),
  birthRegistration: z.string().nullable(),
  mobile: z.string().nullable(),
  email: z.string().nullable(),
  education: z.string().nullable(),
  occupation: z.string().nullable(),
  maritalStatus: z.string().nullable(),
  fatherName: z.string().nullable(),
  fatherNid: z.string().nullable(),
  motherName: z.string().nullable(),
  motherNid: z.string().nullable(),
  spouseName: z.string().nullable(),
  spouseNid: z.string().nullable(),
  tin: z.string().nullable(),
  passport: z.string().nullable(),
  drivingLicense: z.string().nullable(),
  disability: z.string().nullable(),
  identificationMark: z.string().nullable(),
  voterArea: z.string().nullable(),
  homeDescription: z.string().nullable(),
  presentAddress: NidAddressSchema,
  permanentAddress: NidAddressSchema,
  photoUrl: z.string().url().nullable(),
});

export type NidLookupRequest = z.infer<typeof NidLookupRequestSchema>;
export type NidAddress = z.infer<typeof NidAddressSchema>;
export type NormalizedNidRecord = z.infer<typeof NormalizedNidRecordSchema>;
