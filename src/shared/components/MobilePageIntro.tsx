import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

/** Shared compact app-native title section for calculator and records screens. */
export default function MobilePageIntro({ eyebrow, title, description }: Props) {
  return (
    <section className="border-b border-[var(--border-color)] bg-[var(--brand-green-faint)] px-4 pb-7 pt-5 md:hidden">
      <div className="mx-auto max-w-3xl">
        <Link
          href={FEATURE_ROUTES.allServices}
          className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 text-base font-extrabold text-[var(--foreground)] no-underline"
        >
          <ArrowLeft size={16} /> সব সেবা
        </Link>
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[var(--primary)]">
          <ShieldCheck size={16} /> {eyebrow}
        </p>
        <h1 className="mt-2 text-[clamp(1.7rem,6vw,2.2rem)] font-black leading-tight tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-3 max-w-prose text-base leading-7 text-[var(--muted-foreground)]">{description}</p>
      </div>
    </section>
  );
}
