"use client";

import Link from "next/link";
import { Facebook, Mail, MessageCircle, ArrowRight } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

export default function ContactSection() {
  return (
    <section className="border-t border-[var(--border-color)] bg-[var(--background)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A6B3C]/10 text-[#1A6B3C]">
            <MessageCircle size={28} />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            সাহায্য দরকার? <span className="text-[#1A6B3C]">যোগাযোগ করুন</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
            টুল বা সাইট সংক্রান্ত প্রশ্ন, পরামর্শ বা সমস্যার জন্য আমাদের সঙ্গে যোগাযোগ করুন।
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1A6B3C] px-5 py-3 text-sm font-bold text-white no-underline shadow-sm hover:bg-[#155b33]"
            >
              <Mail size={16} />
              {SITE_CONFIG.contactEmail}
            </a>
            <a
              href="#"
              aria-label="Facebook — শীঘ্রই আসছে"
              title="Facebook — শীঘ্রই আসছে"
              onClick={(e) => e.preventDefault()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]"
            >
              <Facebook size={16} /> Facebook
            </a>
            <a
              href="#"
              aria-label="WhatsApp — শীঘ্রই আসছে"
              title="WhatsApp — শীঘ্রই আসছে"
              onClick={(e) => e.preventDefault()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <Link
              href={FEATURE_ROUTES.contact}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-3 text-sm font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]"
            >
              যোগাযোগ পৃষ্ঠা <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-6 inline-flex rounded-full border border-[var(--border-color)] bg-[var(--secondary)] px-4 py-2 text-xs font-medium text-[var(--muted-foreground)]">
            সাপোর্ট ইমেইল: {SITE_CONFIG.contactEmail}
          </div>
        </div>
      </div>
    </section>
  );
}
