/** LandBD-owned validation feedback. Calculation and legal rules stay in the domain engine. */
export function formatFaraezValidationMessage(message: string): string {
  if (message.startsWith("Asset ") && message.includes("finite number")) {
    return "সম্পত্তির ঘরে সঠিক সংখ্যা লিখুন।";
  }
  if (message.startsWith("Asset ") && message.includes("cannot be negative")) {
    return "সম্পত্তির পরিমাণ ঋণাত্মক হতে পারে না।";
  }
  if (message.startsWith("Heir count ")) {
    return "ওয়ারিশের সংখ্যা শূন্য বা ধনাত্মক পূর্ণসংখ্যা হতে হবে।";
  }
  if (message.startsWith("Predeceased son/daughter cases")) {
    return "আগে মারা যাওয়া ছেলে বা মেয়ের জীবিত বংশধর থাকলে বিশেষ উত্তরাধিকার বিধি প্রযোজ্য। তাঁদের বিস্তারিত তথ্য ছাড়া এই ক্যালকুলেটর নিরাপদভাবে অংশ হিসাব করতে পারে না।";
  }
  if (message.startsWith("Funeral cost and debt exceed")) {
    return "দাফন খরচ ও ঋণের মোট পরিমাণ দেখানো নগদ সম্পত্তির বেশি। হিসাবের আগে পরিশোধের উৎস ও সম্পদের মূল্যায়ন নির্ধারণ করুন।";
  }
  if (message.startsWith("Wasiyat cannot exceed")) {
    return "দাফন খরচ ও ঋণ বাদে অবশিষ্ট নগদ সম্পত্তির এক-তৃতীয়াংশের বেশি ওসিয়ত দেখানো হয়েছে। জমি ও স্বর্ণসহ মিশ্র সম্পত্তির ওসিয়ত হিসাবের আগে সম্পদের মূল্যায়ন প্রয়োজন।";
  }
  return "ইনপুটের কিছু তথ্য সঠিক নয়। পরিমাণ ও ওয়ারিশের সংখ্যা যাচাই করুন।";
}
