"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calculator, ShieldCheck, FileText, HelpCircle, Map } from "lucide-react";

export default function Footer() {
  const [dynamicPages, setDynamicPages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const q = query(collection(db, "dynamic_pages"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        setDynamicPages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error loading footer pages:", e);
      }
    };
    fetchPages();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] border-t border-[#1E293B] py-16 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2 no-underline mb-4">
            <div className="w-8 h-8 rounded-lg accent-bg flex items-center justify-center text-[#0F172A] shadow-sm flex-shrink-0">
              <Map size={18} />
            </div>
            <h4 className="font-bold text-white text-lg m-0">
              LandBD <span className="accent-text">3.0</span>
            </h4>
          </Link>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed" style={{ maxWidth: "300px" }}>
            খতিয়ানের হিসাব, জমির পরিমাপ এবং আইনি উত্তরাধিকার বন্টনের সবচেয়ে স্মার্ট
            এবং নির্ভরযোগ্য জিআইএস প্ল্যাটফর্ম।
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-4">
            কুইক লিংক
          </h4>
          <ul className="list-none p-0 m-0 space-y-2">
            {[
              { href: "/khatiyan", label: "খতিয়ান হিসাব" },
              { href: "/faraez", label: "ফারায়েজ হিসাব" },
              { href: "/land-measurement", label: "জমি পরিমাপ" },
              { href: "/blog", label: "আইন বিষয়ক ব্লগ" },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-slate-400 text-sm no-underline hover:text-[#f6c343] transition-colors duration-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Pages */}
        <div>
          <h4 className="font-semibold text-white mb-4">
            গুরুত্বপূর্ণ পেজ
          </h4>
          <ul className="list-none p-0 m-0 space-y-2">
            <li>
              <Link
                href="/privacy"
                className="flex items-center gap-2 text-slate-400 text-sm no-underline hover:text-[#f6c343] transition-colors duration-200"
              >
                <ShieldCheck size={15} className="accent-text flex-shrink-0" />
                প্রাইভেসি পলিসি
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="flex items-center gap-2 text-slate-400 text-sm no-underline hover:text-[#f6c343] transition-colors duration-200"
              >
                <FileText size={15} className="accent-text flex-shrink-0" />
                ব্যবহারের শর্তাবলী
              </Link>
            </li>
            <li>
              <Link
                href="/faq"
                className="flex items-center gap-2 text-slate-400 text-sm no-underline hover:text-[#f6c343] transition-colors duration-200"
              >
                <HelpCircle size={15} className="accent-text flex-shrink-0" />
                সাধারণ জিজ্ঞাসা
              </Link>
            </li>
          </ul>
        </div>

        {/* Dynamic Pages / Sitemap */}
        <div>
          <h4 className="font-semibold text-white mb-4">
            সাইট ম্যাপ
          </h4>
          <ul className="list-none p-0 m-0 space-y-2">
            {dynamicPages.map((page) => (
              <li key={page.id}>
                <Link
                  href={`/p/${page.slug}`}
                  className="text-slate-400 text-sm no-underline hover:text-[#f6c343] transition-colors duration-200"
                >
                  {page.title}
                </Link>
              </li>
            ))}
            {dynamicPages.length === 0 && (
              <li className="text-slate-400 text-sm">কোনো পেজ যুক্ত করা হয়নি।</li>
            )}
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#1E293B] flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="m-0 text-slate-400 text-xs">
          &copy; {currentYear} LandBD. সর্বস্বত্ব সংরক্ষিত।
        </p>
        <p className="m-0 text-slate-400 text-xs">
          কারিগরি সহযোগিতায় <span className="font-medium text-white">Omar Faruk</span>
        </p>
      </div>
    </footer>
  );
}