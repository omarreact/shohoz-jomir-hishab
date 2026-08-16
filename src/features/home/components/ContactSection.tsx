"use client";

import { Send, Mail, User, MessageSquare } from "lucide-react";

export default function ContactSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Background with slight gradient overlay */}
      <div className="absolute inset-0 bg-[#006a4e] opacity-[0.02] dark:opacity-5 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-3xl p-8 md:p-12 lg:p-16 text-center max-w-4xl mx-auto border border-slate-200 dark:border-slate-800 fade-in visible">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white leading-tight">
            যেকোনো প্রয়োজনে <br />
            আমাদের সাথে <span className="text-[#006a4e]">যোগাযোগ করুন</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            ভূমি সংক্রান্ত যেকোনো আইনি সহায়তা, সিস্টেমের সমস্যা অথবা পরামর্শের
            জন্য আমাদের এক্সপার্ট টিমের সাথে যোগাযোগ করুন।
          </p>

          <form className="max-w-md mx-auto space-y-5 text-left">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={20} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="আপনার নাম"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-slate-400" />
              </div>
              <input
                type="email"
                placeholder="আপনার ইমেইল"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors"
              />
            </div>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 pointer-events-none">
                <MessageSquare size={20} className="text-slate-400" />
              </div>
              <textarea
                placeholder="আপনার বার্তা"
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-[#006a4e] transition-colors resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-[#006a4e] text-white font-bold text-lg py-4 rounded-2xl mt-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Send size={18} />
              মেসেজ পাঠান
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
