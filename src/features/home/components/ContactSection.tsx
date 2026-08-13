"use client";

import { Send, Mail, User, MessageSquare } from "lucide-react";

export default function ContactSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background with slight gradient overlay */}
      <div className="absolute inset-0 bg-[var(--bg)]"></div>
      <div className="absolute inset-0 cta-gradient opacity-5 dark:opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="card-new p-8 md:p-12 lg:p-16 text-center max-w-4xl mx-auto border-[var(--accent)] border-opacity-30 fade-in visible">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-[var(--text-primary)] leading-tight">
            যেকোনো প্রয়োজনে <br />
            আমাদের সাথে <span className="accent-text">যোগাযোগ করুন</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-lg mb-10 max-w-2xl mx-auto">
            ভূমি সংক্রান্ত যেকোনো আইনি সহায়তা, সিস্টেমের সমস্যা অথবা পরামর্শের
            জন্য আমাদের এক্সপার্ট টিমের সাথে যোগাযোগ করুন।
          </p>

          <form className="max-w-md mx-auto space-y-4 text-left">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-[var(--text-secondary)]" />
              </div>
              <input
                type="text"
                placeholder="আপনার নাম"
                className="w-full bg-[var(--bg)] border border-c rounded-xl pl-12 pr-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-[var(--text-secondary)]" />
              </div>
              <input
                type="email"
                placeholder="আপনার ইমেইল"
                className="w-full bg-[var(--bg)] border border-c rounded-xl pl-12 pr-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-4 pointer-events-none">
                <MessageSquare size={18} className="text-[var(--text-secondary)]" />
              </div>
              <textarea
                placeholder="আপনার বার্তা"
                rows={4}
                className="w-full bg-[var(--bg)] border border-c rounded-xl pl-12 pr-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full cta-gradient text-white font-bold text-lg py-4 rounded-xl mt-4 hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
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
