"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calculator, ShieldCheck, FileText, HelpCircle } from "lucide-react";

type FooterPage = { id: string; title: string; slug: string };

export default function Footer() {
  const [dynamicPages, setDynamicPages] = useState<FooterPage[]>([]);

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => r.ok ? r.json() : { pages: [] })
      .then((data) => setDynamicPages(data.pages ?? []))
      .catch(() => {});
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white pt-12 pb-8 mt-auto border-t border-[#006a4e]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Section */}
          <div className="mb-6 lg:mb-0">
            <Link href="/" className="flex items-center text-white no-underline mb-4">
              <div className="bg-[#006a4e] text-white rounded-full p-2 mr-3 flex items-center justify-center shadow-sm w-[40px] h-[40px] shrink-0">
                <Calculator size={20} />
              </div>
              <h4 className="font-bold text-xl m-0">সহজ জমির হিসাব</h4>
            </Link>
            <p className="text-white/75 text-sm m-0 leading-loose max-w-[350px]">
              খতিয়ানের হিসাব, জমির পরিমাপ এবং আইনি উত্তরাধিকার (ফারায়েজ) বন্টনের সবচেয়ে স্মার্ট এবং নির্ভরযোগ্য ডিজিটাল সমাধান।
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="mb-6 lg:mb-0 lg:col-span-1">
            <h6 className="font-bold text-[#006a4e] mb-4 uppercase text-sm tracking-wider">কুইক লিংক</h6>
            <ul className="list-none p-0 m-0 space-y-3">
              <li><Link href="/khatiyan" className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">খতিয়ান হিসাব</Link></li>
              <li><Link href="/faraez" className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">ফারায়েজ হিসাব</Link></li>
              <li><Link href="/land-measurement" className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">জমি পরিমাপ</Link></li>
              <li><Link href="/blog" className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">আইন বিষয়ক ব্লগ</Link></li>
            </ul>
          </div>

          {/* Legal Pages (Terms & Privacy) */}
          <div className="mb-6 lg:mb-0 lg:col-span-1">
            <h6 className="font-bold text-[#006a4e] mb-4 uppercase text-sm tracking-wider">গুরুত্বপূর্ণ পেজ</h6>
            <ul className="list-none p-0 m-0 space-y-3">
              <li>
                <Link href="/privacy" className="flex items-center text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">
                  <ShieldCheck size={16} className="mr-2 text-[#006a4e] shrink-0"/> প্রাইভেসি পলিসি
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">
                  <FileText size={16} className="mr-2 text-[#006a4e] shrink-0"/> ব্যবহারের শর্তাবলী
                </Link>
              </li>
              <li>
                <Link href="/faq" className="flex items-center text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">
                  <HelpCircle size={16} className="mr-2 text-[#006a4e] shrink-0"/> সাধারণ জিজ্ঞাসা
                </Link>
              </li>
            </ul>
          </div>

          {/* Dynamic Pages (From Admin Panel) */}
          <div className="lg:col-span-1">
            <h6 className="font-bold text-[#006a4e] mb-4 uppercase text-sm tracking-wider">সাইট ম্যাপ</h6>
            <ul className="list-none p-0 m-0 space-y-3">
              {dynamicPages.map(page => (
                <li key={page.id}>
                  <Link href={`/p/${page.slug}`} className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm">
                    {page.title}
                  </Link>
                </li>
              ))}
              {dynamicPages.length === 0 && (
                <li className="text-white/50 text-sm">কোনো পেজ যুক্ত করা হয়নি।</li>
              )}
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="text-center text-white/50 text-xs mt-12 pt-6 border-t border-white/10">
          <p className="m-0">
            &copy; {currentYear} সহজ জমির হিসাব। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}