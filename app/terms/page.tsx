import AppHeader from "@/src/shared/components/AppHeader";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="container py-5 fade-in">
      <AppHeader />
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
            <h2 className="fw-bold text-success mb-4 d-flex align-items-center">
              <FileText className="me-2" size={28} /> ব্যবহারের শর্তাবলী
            </h2>
            
            <h5 className="fw-bold mt-4">১. সাধারণ শর্ত</h5>
            <p className="text-secondary">এই ওয়েবসাইটটি ব্যবহার করার অর্থ হলো আপনি আমাদের সকল শর্তাবলীর সাথে একমত। যদি একমত না হন, তবে দয়া করে সাইটটি ব্যবহার করা থেকে বিরত থাকুন।</p>
            
            <h5 className="fw-bold mt-4">২. ফলাফলের দায়বদ্ধতা (Disclaimer)</h5>
            <p className="text-secondary">এই ওয়েবসাইটের ক্যালকুলেটরগুলো শুধুমাত্র ধারণা দেওয়ার জন্য একটি ডিজিটাল টুলমাত্র। এই ফলাফলের ওপর ভিত্তি করে কোনো আইনি সিদ্ধান্ত নেওয়ার আগে অবশ্যই একজন অভিজ্ঞ আইনজীবী বা ভূমি কর্মকর্তার পরামর্শ নেওয়ার অনুরোধ করা হলো। কোনো গাণিতিক ভুলের জন্য কর্তৃপক্ষ দায়ী থাকবে না।</p>
            
            <h5 className="fw-bold mt-4">৩. কপিরাইট</h5>
            <p className="text-secondary">এই ওয়েবসাইটের ডিজাইন, কোড এবং কন্টেন্ট সম্পূর্ণ কপিরাইট সংরক্ষিত। অনুমতি ছাড়া এটি বাণিজ্যিক ব্যবহার দণ্ডনীয় অপরাধ।</p>
          </div>
        </div>
      </div>
    </div>
  );
}