import AppHeader from "@/src/shared/components/AppHeader";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container py-5 fade-in">
      <AppHeader />
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
            <h2 className="fw-bold text-success mb-4 d-flex align-items-center">
              <ShieldCheck className="me-2" size={28} /> প্রাইভেসি পলিসি
            </h2>
            <p className="text-muted">সর্বশেষ আপডেট: {new Date().toLocaleDateString("bn-BD")}</p>
            
            <h5 className="fw-bold mt-4">১. তথ্য সংগ্রহ</h5>
            <p className="text-secondary">আমরা আমাদের ব্যবহারকারীদের কোনো ব্যক্তিগত তথ্য (যেমন- নাম, ফোন নম্বর, ঠিকানা) সার্ভারে সংরক্ষণ করি না। আপনার করা সকল হিসাব আপনার ব্রাউজারেই (Local Storage) সেভ থাকে।</p>
            
            <h5 className="fw-bold mt-4">২. কুকিজ (Cookies) ও বিজ্ঞাপন</h5>
            <p className="text-secondary">গুগল অ্যাডসেন্স বা অন্যান্য থার্ড-পার্টি বিজ্ঞাপনদাতারা ব্যবহারকারীর পছন্দ অনুযায়ী বিজ্ঞাপন দেখানোর জন্য কুকিজ ব্যবহার করতে পারে।</p>
            
            <h5 className="fw-bold mt-4">৩. থার্ড-পার্টি লিংক</h5>
            <p className="text-secondary">আমাদের ওয়েবসাইটে অন্যান্য ওয়েবসাইটের লিংক থাকতে পারে। ওই ওয়েবসাইটগুলোর প্রাইভেসি পলিসির দায়ভার আমাদের নয়।</p>
          </div>
        </div>
      </div>
    </div>
  );
}