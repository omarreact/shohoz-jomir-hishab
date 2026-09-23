import { z } from "zod";

export const WARISH_RELATIONS = [
  "স্বামী",
  "স্ত্রী",
  "পুত্র",
  "কন্যা",
  "পিতা",
  "মাতা",
  "দাদা",
  "দাদী",
  "নানা",
  "নানী",
  "ভাই",
  "বোন",
  "সৎ ভাই",
  "সৎ বোন",
] as const;

export const warishHeirSchema = z.object({
  name: z.string().trim().min(2, "ওয়ারিশের নাম লিখুন"),
  relation: z.enum(WARISH_RELATIONS, { message: "সম্পর্ক নির্বাচন করুন" }),
  idNumber: z.string().trim().max(30, "আইডি নম্বর সর্বোচ্চ ৩০ অক্ষর হতে পারে").optional(),
});

export const warishSanadSchema = z.object({
  referenceNo: z.string().trim().min(1, "স্মারক নম্বর লিখুন"),
  issueDate: z.string().trim().min(1, "তারিখ নির্বাচন করুন"),
  ward: z.string().trim().min(1, "ওয়ার্ড নির্বাচন করুন"),
  zoneId: z.string().trim().min(1, "জোন লোড হয়নি"),
  zoneName: z.string().trim().min(1, "জোন লোড হয়নি"),
  deceasedName: z.string().trim().min(2, "মৃত ব্যক্তির নাম লিখুন"),
  fatherOrHusbandName: z.string().trim().min(2, "পিতা/স্বামীর নাম লিখুন"),
  motherName: z.string().trim().min(2, "মাতার নাম লিখুন"),
  deathDate: z.string().trim().optional(),
  address: z.string().trim().min(5, "পূর্ণ ঠিকানা লিখুন"),
  applicantName: z.string().trim().min(2, "আবেদনকারীর নাম লিখুন"),
  officerName: z.string().trim().min(2, "কর্মকর্তার নাম লিখুন"),
  officerTitle: z.string().trim().min(2, "কর্মকর্তার পদবি লিখুন"),
  councillorName: z.string().trim().min(2, "কাউন্সিলরের নাম লিখুন"),
  councillorTitle: z.string().trim().min(2, "কাউন্সিলরের পদবি লিখুন"),
  heirs: z.array(warishHeirSchema).min(1, "কমপক্ষে একজন ওয়ারিশ যোগ করুন").max(6, "সর্বোচ্চ ৬ জন ওয়ারিশ যোগ করা যাবে"),
});

export type WarishSanadFormValues = z.infer<typeof warishSanadSchema>;
