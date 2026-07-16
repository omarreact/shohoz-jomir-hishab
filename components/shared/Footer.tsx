"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calculator, ShieldCheck, FileText, HelpCircle } from "lucide-react";

export default function Footer() {
  const [dynamicPages, setDynamicPages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const q = query(collection(db, "dynamic_pages"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        setDynamicPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error loading footer pages:", e);
      }
    };
    fetchPages();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="pt-5 pb-4 mt-auto border-top border-secondary border-opacity-25" style={{ backgroundColor: "var(--background)" }}>
      <div className="container">
        <div className="row g-4 mb-4">
          
          {/* Brand Section */}
          <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
            <Link href="/" className="d-flex align-items-center text-white text-decoration-none mb-3">
              <div className="bg-primary text-dark rounded-circle p-2 me-2 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
                <Calculator size={20} />
              </div>
              <h4 className="fw-bold mb-0 text-white">LandBD <span className="text-primary">3.0</span></h4>
            </Link>
            <p className="text-secondary small mb-0 lh-lg" style={{ maxWidth: "350px" }}>
              খতিয়ানের হিসাব, জমির পরিমাপ এবং আইনি উত্তরাধিকার বন্টনের সবচেয়ে স্মার্ট এবং নির্ভরযোগ্য জিআইএস প্ল্যাটফর্ম।
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
            <h6 className="fw-bold text-primary mb-3 text-uppercase">কুইক লিংক</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2"><Link href="/khatiyan" className="text-secondary text-decoration-none hover-text-primary transition-all">খতিয়ান হিসাব</Link></li>
              <li className="mb-2"><Link href="/faraez" className="text-secondary text-decoration-none hover-text-primary transition-all">ফারায়েজ হিসাব</Link></li>
              <li className="mb-2"><Link href="/land-measurement" className="text-secondary text-decoration-none hover-text-primary transition-all">জমি পরিমাপ</Link></li>
              <li className="mb-2"><Link href="/blog" className="text-secondary text-decoration-none hover-text-primary transition-all">আইন বিষয়ক ব্লগ</Link></li>
            </ul>
          </div>

          {/* Legal Pages (Terms & Privacy) */}
          <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
            <h6 className="fw-bold text-primary mb-3 text-uppercase">গুরুত্বপূর্ণ পেজ</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link href="/privacy" className="text-secondary text-decoration-none hover-text-primary transition-all d-flex align-items-center">
                  <ShieldCheck size={16} className="me-2 text-primary"/> প্রাইভেসি পলিসি
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/terms" className="text-secondary text-decoration-none hover-text-primary transition-all d-flex align-items-center">
                  <FileText size={16} className="me-2 text-primary"/> ব্যবহারের শর্তাবলী
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/faq" className="text-secondary text-decoration-none hover-text-primary transition-all d-flex align-items-center">
                  <HelpCircle size={16} className="me-2 text-primary"/> সাধারণ জিজ্ঞাসা
                </Link>
              </li>
            </ul>
          </div>

          {/* Dynamic Pages (From Admin Panel) */}
          <div className="col-lg-3 col-md-6">
            <h6 className="fw-bold text-primary mb-3 text-uppercase">সাইট ম্যাপ</h6>
            <ul className="list-unstyled mb-0">
              {dynamicPages.map(page => (
                <li key={page.id} className="mb-2">
                  <Link href={`/p/${page.slug}`} className="text-secondary text-decoration-none hover-text-primary transition-all">
                    {page.title}
                  </Link>
                </li>
              ))}
              {dynamicPages.length === 0 && (
                <li className="text-secondary small">কোনো পেজ যুক্ত করা হয়নি।</li>
              )}
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="text-center text-muted small mt-5 pt-4 border-top border-secondary border-opacity-25">
          <p className="mb-0">
            &copy; {currentYear} LandBD. সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </div>
    </footer>
  );
}