const BANGLA_DIGITS: Record<string, string> = {
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

const UI_TRANSLATIONS: Record<string, string> = {
  "Mutation Verification Record": "নামজারি যাচাইকরণ রেকর্ড",
  "Verification ID": "যাচাইকরণ আইডি",
  "Tracking ID": "ট্র্যাকিং আইডি",
  "View Details": "বিস্তারিত দেখুন",
  "No data available": "কোনো তথ্য পাওয়া যায়নি",
  "No data": "কোনো তথ্য নেই",
  "User Management": "ব্যবহারকারী ব্যবস্থাপনা",
  "Blog Management": "ব্লগ ব্যবস্থাপনা",
  "Data Monitor": "ডেটা মনিটর",
  "Map Visitors": "মানচিত্র দর্শনার্থী",
  "Total Land": "মোট জমি",
  "Super Admin": "সুপার অ্যাডমিন",
  "OpenStreetMap": "ওপেনস্ট্রিটম্যাপ",
  "Last seen": "সর্বশেষ দেখা",
  "Loading...": "লোড হচ্ছে...",
  "Loading": "লোড হচ্ছে",
  "Search": "খুঁজুন",
  "Download": "ডাউনলোড",
  "Save": "সংরক্ষণ করুন",
  "Cancel": "বাতিল করুন",
  "Close": "বন্ধ করুন",
  "Delete": "মুছুন",
  "Edit": "সম্পাদনা করুন",
  "Details": "বিস্তারিত",
  "Retry": "আবার চেষ্টা করুন",
  "Previous": "পূর্ববর্তী",
  "Next": "পরবর্তী",
  "Back": "ফিরে যান",
  "Home": "হোম",
  "Dashboard": "ড্যাশবোর্ড",
  "Settings": "সেটিংস",
  "Users": "ব্যবহারকারী",
  "Logout": "লগআউট",
  "Login": "লগইন",
  "Email": "ইমেইল",
  "Password": "পাসওয়ার্ড",
  "Name": "নাম",
  "Role": "ভূমিকা",
  "Status": "অবস্থা",
  "Actions": "কার্যক্রম",
  "Active": "সক্রিয়",
  "Inactive": "নিষ্ক্রিয়",
  "Public": "পাবলিক",
  "Private": "প্রাইভেট",
  "Page": "পৃষ্ঠা",
  "Pages": "পৃষ্ঠাসমূহ",
  "Admin": "অ্যাডমিন",
  "Created": "তৈরি",
  "Updated": "হালনাগাদ",
  "Date": "তারিখ",
  "Time": "সময়",
  "Total": "মোট",
  "Results": "ফলাফল",
  "Result": "ফলাফল",
  "Owner": "মালিক",
  "Owners": "মালিকগণ",
  "Guardian": "অভিভাবক",
  "Guardians": "অভিভাবকগণ",
  "Dag": "দাগ",
  "Dags": "দাগসমূহ",
  "Khatian": "খতিয়ান",
  "Mouza": "মৌজা",
  "District": "জেলা",
  "Upazila": "উপজেলা",
  "Division": "বিভাগ",
  "Survey": "জরিপ",
  "Land": "জমি",
  "Copy": "কপি করুন",
  "Copied": "কপি হয়েছে",
  "Open": "খুলুন",
  "Expand": "প্রসারিত করুন",
  "Collapse": "সংকুচিত করুন",
  "Fullscreen": "পূর্ণপর্দা",
  "Location": "অবস্থান",
  "Layer": "স্তর",
  "Layers": "স্তরসমূহ",
  "Basemap": "বেসম্যাপ",
  "Satellite": "স্যাটেলাইট",
  "Light": "লাইট",
  "Dark": "ডার্ক",
  "System": "সিস্টেম",
  "Success": "সফল",
  "Error": "ত্রুটি",
  "Warning": "সতর্কতা",
  "Unknown": "অজানা",
  "Enabled": "চালু",
  "Disabled": "বন্ধ",
  "Yes": "হ্যাঁ",
  "No": "না",
  "Optional": "ঐচ্ছিক",
  "Required": "আবশ্যক",
  "Submit": "জমা দিন",
  "Reset": "রিসেট করুন",
  "Clear": "পরিষ্কার করুন",
  "Refresh": "রিফ্রেশ করুন",
  "Print": "প্রিন্ট করুন",
  "Export": "এক্সপোর্ট করুন",
  "Import": "ইমপোর্ট করুন",
  "Upload": "আপলোড করুন",
  "File": "ফাইল",
  "Files": "ফাইলসমূহ",
  "Image": "ছবি",
  "Map": "মানচিত্র",
  "Coordinates": "স্থানাঙ্ক",
  "Latitude": "অক্ষাংশ",
  "Longitude": "দ্রাঘিমাংশ",
  "Accuracy": "নির্ভুলতা",
  "Browser": "ব্রাউজার",
  "Platform": "প্ল্যাটফর্ম",
  "Language": "ভাষা",
  "Timezone": "সময় অঞ্চল",
  "Screen": "স্ক্রিন",
  "Network": "নেটওয়ার্ক",
  "Referrer": "রেফারার",
  "API": "এপিআই",
  "PDF": "পিডিএফ",
  "GIS": "জিআইএস",
  "DLRMS": "ডিএলআরএমএস",
  "QR": "কিউআর",
  "UUID": "ইউইউআইডি",
  "URL": "ইউআরএল",
  "ID": "আইডি",
  "JSON": "জেসন",
  "Partial": "আংশিক",
  "LandBD": "ল্যান্ডবিডি",
};

const UI_PHRASE_REPLACEMENTS: Record<string, string> = {
  "এম এস-এর বিদ্যমান রাজউক ফিচারসার্ভার ঠিকানা-ধাপ ব্যবহার করেই অনুসন্ধান সংকুচিত করা হচ্ছে; মূল আর এস/এম এস ডেটা উৎস ও এপিআই অপরিবর্তিত।":
    "নির্বাচিত এলাকা ব্যবহার করে এম এস প্লট অনুসন্ধান আরও নির্দিষ্ট করা হবে।",
};

const TECHNICAL_SEGMENT_RE = /(https?:\/\/[^\s]+|\/api\/[^\s]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|\b[0-9a-f]{20,}\b)/gi;

const TRANSLATION_ENTRIES = Object.entries(UI_TRANSLATIONS).sort(
  ([a], [b]) => b.length - a.length,
);

const PHRASE_REPLACEMENT_ENTRIES = Object.entries(UI_PHRASE_REPLACEMENTS).sort(
  ([a], [b]) => b.length - a.length,
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function protectTechnicalSegments(value: string): {
  protectedText: string;
  restore: (text: string) => string;
} {
  const segments: string[] = [];
  const protectedText = value.replace(TECHNICAL_SEGMENT_RE, (match) => {
    const marker = String.fromCharCode(0xe000 + segments.length);
    segments.push(match);
    return marker;
  });

  return {
    protectedText,
    restore: (text: string) =>
      segments.reduce(
        (result, segment, index) =>
          result.replace(String.fromCharCode(0xe000 + index), segment),
        text,
      ),
  };
}

export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] ?? digit);
}

export function translateUiText(value: string): string {
  if (!value) return value;

  const { protectedText, restore } = protectTechnicalSegments(value);
  let translated = protectedText;

  for (const [source, replacement] of PHRASE_REPLACEMENT_ENTRIES) {
    translated = translated.split(source).join(replacement);
  }

  for (const [english, bangla] of TRANSLATION_ENTRIES) {
    const pattern = new RegExp(`\\b${escapeRegExp(english)}\\b`, "gi");
    translated = translated.replace(pattern, bangla);
  }

  translated = toBanglaDigits(translated);
  return restore(translated);
}

export function formatBanglaNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat("bn-BD", options).format(value);
}

export function formatBanglaDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("bn-BD", options).format(date);
}
