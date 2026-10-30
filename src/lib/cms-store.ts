import "server-only";
// Firebase Admin is loaded only when credentials are configured. Public CMS
// defaults must render on Workers without evaluating the Node/gRPC client.
import type { Metadata } from "next";
export const CMS_SLUGS=["about","privacy","terms","faq","api-docs","homepage","navigation","footer","notice"] as const;
export type CmsSlug=(typeof CMS_SLUGS)[number];
export type CmsSection={heading:string;body:string};
export type CmsPage={
 slug:CmsSlug;title:string;description:string;sections:CmsSection[];revision:number;
 published:boolean;seoTitle:string;seoDescription:string;updatedAt:string|null
};
const CONTENT:Record<CmsSlug,Omit<CmsPage,"slug"|"updatedAt"|"revision">>={
 about:{title:"LandBD সম্পর্কে",description:"বাংলাদেশের জমির পরিমাপ ও রেকর্ড বুঝতে ডিজিটাল সহায়তা।",
 sections:[{heading:"আমাদের সেবা",body:"LandBD জমির পরিমাপ, খতিয়ানের হিসাব, ফারায়েজ এবং মৌজা মানচিত্রের জন্য অনলাইন টুলস প্রদান করে।"},{heading:"তথ্য যাচাই",body:"ডিজিটাল হিসাব ও তথ্য সহায়ক; আইনগত মালিকানা বা সরকারি রেকর্ডের বিকল্প নয়। সিদ্ধান্তের আগে অনুমোদিত রেকর্ড ও সংশ্লিষ্ট পেশাজীবীর সঙ্গে যাচাই করুন।"}],published:true,seoTitle:"LandBD সম্পর্কে",seoDescription:"LandBD-এর ভূমি পরিমাপ, খতিয়ান ও ডিজিটাল সেবা সম্পর্কে জানুন।"},
 privacy:{title:"গোপনীয়তা নীতি",description:"LandBD-এ তথ্যের ব্যবহার ও সুরক্ষা",
 sections:[{heading:"কী তথ্য প্রক্রিয়াকরণ হয়",body:"অ্যাকাউন্টের প্রোফাইল, সেবা-ব্যবহার সংক্রান্ত লগ, নিরাপত্তা সংক্রান্ত তথ্য এবং মানচিত্রে দেওয়া অবস্থান অনুমতি অনুযায়ী প্রক্রিয়াকরণ হতে পারে। সেবাভেদে ব্রাউজারে স্থানীয়ভাবে গণনার তথ্য রাখা হতে পারে।"},{heading:"পেমেন্ট ও সরবরাহকারী",body:"পেমেন্ট চালু থাকলে অর্থপ্রদানের জন্য অনুমোদিত পেমেন্ট গেটওয়েতে প্রয়োজনীয় লেনদেন তথ্য পাঠানো হয়। পেমেন্ট কার্ডের পূর্ণ তথ্য LandBD সার্ভারে সংরক্ষণ করার উদ্দেশ্য নেই।"},{heading:"সুরক্ষা ও যোগাযোগ",body:"প্রবেশ নিয়ন্ত্রণ ও সার্ভার লগ নিরাপত্তার জন্য ব্যবহৃত হয়। তথ্য-অধিকার বা গোপনীয়তার অনুরোধের জন্য ওয়েবসাইটের যোগাযোগ পাতা ব্যবহার করুন।"}],published:true,seoTitle:"গোপনীয়তা নীতি | LandBD",seoDescription:"LandBD কীভাবে ব্যবহারকারী ও লেনদেন তথ্য প্রক্রিয়াকরণ করে।"},
 terms:{title:"ব্যবহারের শর্তাবলি",description:"LandBD-এর ডিজিটাল ভূমি সেবা ব্যবহারের নীতিমালা",
 sections:[{heading:"তথ্যের সীমাবদ্ধতা",body:"গণনা ও অনলাইন রেকর্ড সহায়ক তথ্য। এগুলো সরকারি ভূমি নথি বা বিশেষজ্ঞ মতামতের বিকল্প নয়। ভুল বা অসম্পূর্ণ ইনপুটে ভিন্ন ফল হতে পারে।"},{heading:"সেবার মূল্য ও ফেরত",body:"পেইড সেবার মূল্য ও প্রযোজ্য শর্ত অর্থপ্রদানের আগে দেখানো হবে। ব্যর্থ বা দ্বৈত লেনদেনের ক্ষেত্রে লেনদেন নম্বরসহ যোগাযোগ করুন। উপযুক্ত পরিস্থিতিতে যাচাই শেষে ফেরত-অনুরোধ বিবেচিত হবে।"},{heading:"দায়িত্বশীল ব্যবহার",body:"অননুমোদিত তথ্য সংগ্রহ, অন্যের অ্যাকাউন্ট ব্যবহার এবং প্রযুক্তিগত বাধা এড়িয়ে প্রবেশ নিষিদ্ধ।"}],published:true,seoTitle:"ব্যবহারের শর্তাবলি | LandBD",seoDescription:"LandBD ভূমি সেবা ব্যবহারের শর্তাবলি পড়ুন।"},
 faq:{title:"সাধারণ প্রশ্নোত্তর",description:"LandBD সম্পর্কে গুরুত্বপূর্ণ প্রশ্নের উত্তর",
 sections:[{heading:"সব সেবা কি ফ্রি?",body:"প্রতিটি সেবার বর্তমান মূল্য সংশ্লিষ্ট সেবার পৃষ্ঠায় দেখানো হয়। প্রশাসক সেবা ফ্রি বা পেইড করতে পারেন।"},{heading:"খতিয়ানের তথ্য কি সরকারি সনদ?",body:"না। LandBD-এ প্রদর্শিত তথ্য সংশ্লিষ্ট উৎসের ওপর নির্ভরশীল; সত্যায়িত নথি সংগ্রহের জন্য সরকারি কর্তৃপক্ষের প্রক্রিয়া অনুসরণ করুন।"},{heading:"ফারায়েজের ফল কীভাবে যাচাই করব?",body:"উত্তরাধিকার পরিস্থিতি ও প্রযোজ্য আইন অনুযায়ী একজন যোগ্য আইনজীবী বা বিশেষজ্ঞের কাছে যাচাই করুন।"}],published:true,seoTitle:"সাধারণ প্রশ্ন | LandBD",seoDescription:"জমির হিসাব, খতিয়ান ও পেমেন্ট সম্পর্কিত প্রশ্নোত্তর।"},
 "api-docs":{title:"API ডকুমেন্টেশন",description:"LandBD API-র ব্যবহার ও প্রবেশ নিয়ন্ত্রণ",
 sections:[{heading:"সাধারণ নীতিমালা",body:"প্রতিটি API-এর অনুমোদিত ব্যবহার, রেট সীমা এবং নির্দিষ্ট অনুমতি প্রযোজ্য। ব্যবহারকারীর তথ্য বা গেটওয়ে কী প্রকাশ্য URL-এ পাঠাবেন না।"},{heading:"প্রযুক্তিগত তথ্য",body:"সার্ভারের API রুটগুলো সম্পূর্ণ প্রকাশ্য API চুক্তি নয়। প্রকাশিত পরিষেবা তালিকা ও অনুমোদিত পরিচয়পত্র ছাড়া সুরক্ষিত রুট ব্যবহার করা যাবে না।"}],published:true,seoTitle:"API ডকুমেন্টেশন | LandBD",seoDescription:"LandBD API প্রবেশাধিকার ও তথ্য সুরক্ষা নির্দেশনা।"},
 homepage:{title:"ডিজিটাল ভূমি সেবা ও জমির হিসাব",description:"মানচিত্র, খতিয়ান, উত্তরাধিকার ও ভূমি পরিমাপ একই প্ল্যাটফর্মে।",sections:[{heading:"সেবা বেছে নিন",body:"নিজের প্রয়োজন অনুযায়ী খতিয়ান, পরিমাপ, ফারায়েজ বা মৌজা মানচিত্র বেছে নিন।"}],published:true,seoTitle:"LandBD | ডিজিটাল ভূমি সেবা",seoDescription:"বাংলাদেশের জমির হিসাব, মৌজা মানচিত্র ও খতিয়ান তথ্যের প্ল্যাটফর্ম।"},
 navigation:{title:"নেভিগেশন",description:"LandBD প্রধান মেনু",sections:[],published:true,seoTitle:"LandBD নেভিগেশন",seoDescription:""},
 footer:{title:"LandBD",description:"জমির তথ্য ও ডিজিটাল হিসাবের সহায়ক প্ল্যাটফর্ম",sections:[],published:true,seoTitle:"LandBD",seoDescription:""},
 notice:{title:"ঘোষণা",description:"সেবার সর্বশেষ পরিবর্তন জানতে বিস্তারিত দেখুন।",sections:[],published:false,seoTitle:"LandBD নোটিশ",seoDescription:""}
};
export function isCmsSlug(value:unknown):value is CmsSlug{
 return typeof value==="string"&&CMS_SLUGS.some(s=>s===value);
}
export function defaultCmsPage(slug:CmsSlug):CmsPage{return {slug,...CONTENT[slug],revision:0,updatedAt:null};}
export async function getCmsPage(slug:CmsSlug):Promise<CmsPage>{
 const fallback=defaultCmsPage(slug);
 const useAdmin =
   process.env.LANDBD_PLATFORM !== "cloudflare-workers" ||
   Boolean(
     process.env.FIREBASE_PROJECT_ID &&
     process.env.FIREBASE_CLIENT_EMAIL &&
     process.env.FIREBASE_PRIVATE_KEY,
   );
 if (!useAdmin) return fallback;
 const { db, isFirebaseAdminReady } =
   await import("@/src/modules/database/firebaseAdmin");
 if(!isFirebaseAdminReady())return fallback;
 const snap=await db.collection("landbdCmsPages").doc(slug).get();
 if(!snap.exists)return fallback;
 const d=snap.data()??{};
 return {slug,revision:typeof d.revision==="number"&&Number.isSafeInteger(d.revision)&&d.revision>=0?d.revision:0,title:typeof d.title==="string"?d.title:fallback.title,
 description:typeof d.description==="string"?d.description:fallback.description,
 sections:Array.isArray(d.sections)?d.sections.filter((v:unknown)=>!!v&&typeof v==="object"&&typeof (v as CmsSection).heading==="string"&&typeof (v as CmsSection).body==="string").slice(0,40):fallback.sections,
 published:typeof d.published==="boolean"?d.published:fallback.published,
 seoTitle:typeof d.seoTitle==="string"?d.seoTitle:fallback.seoTitle,
 seoDescription:typeof d.seoDescription==="string"?d.seoDescription:fallback.seoDescription,
 updatedAt:typeof d.updatedAt==="string"?d.updatedAt:null};
}
export async function getAllCmsPages():Promise<CmsPage[]>{
 return Promise.all(CMS_SLUGS.map(getCmsPage));
}
export async function cmsMetadata(slug:CmsSlug):Promise<Metadata>{
 const d=await getCmsPage(slug);
 return {title:d.seoTitle||d.title,description:d.seoDescription||d.description,
 alternates:{canonical:slug==="homepage"?"/":"/"+slug},
 openGraph:{title:d.seoTitle||d.title,description:d.seoDescription||d.description,locale:"bn_BD",siteName:"LandBD",type:"website"},
 twitter:{card:"summary_large_image",title:d.seoTitle||d.title,description:d.seoDescription||d.description},
 robots:d.published?{index:true,follow:true}:{index:false,follow:false}};
}
