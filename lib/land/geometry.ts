export interface SideInput {
  feet: string;
  inches: string;
}

export interface MeasurementResult {
  isValid: boolean;
  errorMsg?: string;
  isAverage?: boolean; // গড় পদ্ধতি চেক করার জন্য
  sqFt: number;
  shotok: number;
  katha: number;
  bigha: number;
  acre: number;
  ojutangsho: number;
  plotData?: any;
}

// ফুট এবং ইঞ্চি থেকে মোট ডেসিমাল ফুটে রূপান্তর
export function toDecimalFeet(side: SideInput): number {
  const f = parseFloat(side.feet) || 0;
  const i = parseFloat(side.inches) || 0;
  return f + (i / 12);
}

// হিরনস ফর্মুলা (Heron's Formula) দিয়ে ত্রিভুজের ক্ষেত্রফল নির্ণয়
export function calculateTriangleArea(a: number, b: number, c: number): number {
  if (a + b <= c || a + c <= b || b + c <= a) {
    return -1; // Invalid Triangle
  }
  const s = (a + b + c) / 2;
  return Math.sqrt(s * (s - a) * (s - b) * (s - c));
}

// সাধারণ রেজাল্ট ফরমেট করার ফাংশন
function formatResult(totalSqFt: number, isAverage: boolean = false): MeasurementResult {
  if (totalSqFt <= 0) {
    return { isValid: false, errorMsg: "পরিমাপগুলো সঠিক নয়।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
  }
  return {
    isValid: true,
    isAverage,
    sqFt: totalSqFt,
    shotok: totalSqFt / 435.6,
    katha: totalSqFt / 720,
    bigha: totalSqFt / 14400,
    acre: totalSqFt / 43560,
    ojutangsho: totalSqFt / 4.356, // অযুতাংশ
  };
}

// ১. আয়তক্ষেত্র (Rectangle)
export function calcRectangle(lInput: SideInput, wInput: SideInput): MeasurementResult {
  const l = toDecimalFeet(lInput);
  const w = toDecimalFeet(wInput);
  if (l <= 0 || w <= 0) return { isValid: false, errorMsg: "দৈর্ঘ্য ও প্রস্থের সঠিক মাপ দিন।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
  return formatResult(l * w);
}

// ২. ত্রিভুজ (Triangle)
export function calcTriangle(s1: SideInput, s2: SideInput, s3: SideInput): MeasurementResult {
  const a = toDecimalFeet(s1);
  const b = toDecimalFeet(s2);
  const c = toDecimalFeet(s3);
  const area = calculateTriangleArea(a, b, c);
  if (area < 0) return { isValid: false, errorMsg: "এই মাপে ত্রিভুজ গঠন সম্ভব নয়। বাহুগুলোর মাপ চেক করুন।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
  return formatResult(area);
}

// ৩. চতুর্ভুজ (Quadrilateral - ৪ বাহু, ১ কর্ণ)
export function calcQuadrilateral(s1: SideInput, s2: SideInput, s3: SideInput, s4: SideInput, d: SideInput): MeasurementResult {
  const n = toDecimalFeet(s1);
  const s = toDecimalFeet(s2);
  const e = toDecimalFeet(s3);
  const w = toDecimalFeet(s4);
  const diag = toDecimalFeet(d);

  if (n <= 0 || s <= 0 || e <= 0 || w <= 0) {
    return { isValid: false, errorMsg: "চতুর্ভুজের ৪টি বাহুর মাপ সঠিকভাবে দিন।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
  }

  if (diag > 0) {
    // কর্ণ দেওয়া থাকলে হিরনস ফর্মুলা (নিখুঁত হিসাব)
    const area1 = calculateTriangleArea(n, e, diag);
    const area2 = calculateTriangleArea(s, w, diag);

    if (area1 < 0 || area2 < 0) return { isValid: false, errorMsg: "এই মাপে চতুর্ভুজ গঠন সম্ভব নয়। কর্ণের মাপটি চেক করুন।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
    return formatResult(area1 + area2, false);
  } else {
    // কর্ণ না দিলে গড় পদ্ধতি (Average Method)
    const avgLength = (n + s) / 2;
    const avgWidth = (e + w) / 2;
    const totalArea = avgLength * avgWidth;
    return formatResult(totalArea, true); // true = এটি গড় পদ্ধতিতে বের করা হয়েছে
  }
}

// ৪. পঞ্চভুজ (Pentagon - ৫ বাহু, ২ কর্ণ)
export function calcPentagon(s1: SideInput, s2: SideInput, s3: SideInput, s4: SideInput, s5: SideInput, d1: SideInput, d2: SideInput): MeasurementResult {
  const a = toDecimalFeet(s1);
  const b = toDecimalFeet(s2);
  const c = toDecimalFeet(s3);
  const d = toDecimalFeet(s4);
  const e = toDecimalFeet(s5);
  const diag1 = toDecimalFeet(d1);
  const diag2 = toDecimalFeet(d2);

  if(diag1 <= 0 || diag2 <= 0) return { isValid: false, errorMsg: "পঞ্চভুজের নিখুঁত মাপের জন্য অবশ্যই ২টি কর্ণ দিতে হবে।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };

  const area1 = calculateTriangleArea(a, b, diag1);
  const area2 = calculateTriangleArea(diag1, c, diag2);
  const area3 = calculateTriangleArea(diag2, d, e);

  if (area1 < 0 || area2 < 0 || area3 < 0) return { isValid: false, errorMsg: "পঞ্চভুজের মাপগুলো সঠিক নয়। কর্ণ দুটির মাপ চেক করুন।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
  return formatResult(area1 + area2 + area3);
}

// ৫. বৃত্ত (Circle)
export function calcCircle(dInput: SideInput): MeasurementResult {
  const d = toDecimalFeet(dInput);
  if (d <= 0) return { isValid: false, errorMsg: "সঠিক ব্যাস (Diameter) দিন।", sqFt: 0, shotok: 0, katha: 0, bigha: 0, acre: 0, ojutangsho: 0 };
  const r = d / 2;
  return formatResult(Math.PI * r * r);
}