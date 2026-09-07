export const SITE_CONFIG = {
  /** Public-facing Bangla product name (navbar, footer, titles). */
  name: "সহজ জমির হিসাব",
  /** Short technical / domain brand. */
  shortName: "LandBD",
  description:
    "খতিয়ান হিসাব, জমি পরিমাপ, ফারায়েজ ও নগর পরিকল্পনা মানচিত্র — বাংলাদেশের ভূমি সেবার স্মার্ট সহায়ক।",
  defaultLocale: "bn-BD",
  url: "https://landbd.pincodeit.com",
  contactEmail: "support@landbd.pincodeit.com",
  theme: {
    default: "light" as const,
    allowDark: true,
  },
  /** Shown under calculator / map results. */
  legalDisclaimer:
    "এটি সহায়ক হিসাব ও প্রাথমিক তথ্য; সরকারি রেকর্ড, ভূমি অফিস বা আইনজীবীর পরামর্শের বিকল্প নয়।",
} as const;
