"use client";

import { useState, useEffect, use } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppHeader from "@/components/shared/AppHeader";
import Link from "next/link";

export default function DynamicPageViewer({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const q = query(collection(db, "dynamic_pages"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setPageData(querySnapshot.docs[0].data());
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching dynamic page:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPage();
  }, [slug]);

  if (loading) return <div className="text-center py-5 mt-5">পেজ লোড হচ্ছে...</div>;
  
  if (notFound) return (
    <div className="text-center py-5 mt-5">
      <h3 className="text-danger">৪0৪ - পেজটি পাওয়া যায়নি</h3>
      <Link href="/" className="btn btn-success mt-3">হোমপেজে যান</Link>
    </div>
  );

  return (
    <div className="fade-in pb-5">
      {/* dangerouslySetInnerHTML ব্যবহার করা হয়েছে যাতে 
        অ্যাডমিন প্যানেল থেকে দেওয়া HTML (container, row) 
        হুবহু রেন্ডার হয়।
      */}
      <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
    </div>
  );
}