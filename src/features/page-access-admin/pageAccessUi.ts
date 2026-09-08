import {
  EyeOff,
  Globe2,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  PAGE_ACCESS_PAGES,
  type PageAccessLevel,
} from "@/src/shared/config/pageAccess";

export type AccessUiMeta = {
  label: string;
  description: string;
  icon: LucideIcon;
  badge: string;
};

export const ACCESS_META: Record<PageAccessLevel, AccessUiMeta> = {
  public: {
    label: "সবার জন্য",
    description: "লগইন ছাড়াই দেখা যাবে",
    icon: Globe2,
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  logged_in: {
    label: "লগইন প্রয়োজন",
    description: "শুধু লগইন করা ব্যবহারকারী",
    icon: LockKeyhole,
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  admin: {
    label: "অ্যাডমিন",
    description: "অ্যাডমিন ও সুপার অ্যাডমিন",
    icon: ShieldCheck,
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  },
  super_admin: {
    label: "সুপার অ্যাডমিন",
    description: "শুধুমাত্র সুপার অ্যাডমিন",
    icon: ShieldAlert,
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  },
  hidden: {
    label: "বন্ধ",
    description: "কাউকেই পেজটি দেখানো হবে না",
    icon: EyeOff,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const ACCESS_LEVELS = Object.keys(ACCESS_META) as PageAccessLevel[];
export const PAGE_ACCESS_CATEGORIES = Array.from(
  new Set(PAGE_ACCESS_PAGES.map((page) => page.category)),
);
