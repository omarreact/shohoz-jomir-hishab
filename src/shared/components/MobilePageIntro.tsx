import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

/** Shared compact app-native title section for calculator and records screens. */
export default function MobilePageIntro({ eyebrow, title, description }: Props) {
  return (
    <section className="border-b border-[var(--border-color)] bg-[var(--brand-green-faint)] px-4 pb-5 pt-4 md:hidden">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/explore"
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 text-xs font-extrabold text-[var(--foreground)] no-underline"
        >
          <ArrowLeft size={16} /> সব সেবা
        </Link>
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.12em] text-[var(--primary)]">
          <ShieldCheck size={16} /> {eyebrow}
        </p>
        <h1 className="mt-2 text-[26px] font-black leading-tight tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      </div>
    </section>
  );
}
