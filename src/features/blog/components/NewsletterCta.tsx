import { Mail } from "lucide-react";
import { t } from "@/src/locales";

export default function NewsletterCta() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm max-w-3xl mx-auto p-10 text-center relative overflow-hidden group border-t-4 border-t-[#006a4e]">
      <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
        <Mail size={120} className="text-[#006a4e]" />
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
          {t.newsletter.title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          {t.newsletter.subtitle}
        </p>

        <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <div className="flex-1 relative">
            <input
              type="email"
              placeholder={t.newsletter.placeholder}
              required
              autoComplete="off"
              className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full px-6 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#006a4e] transition-colors shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-full px-8 font-bold bg-[#006a4e] hover:bg-[#00523b] text-white shadow-md hover:-translate-y-0.5 transition-all shrink-0"
          >
            {t.newsletter.button}
          </button>
        </form>
      </div>
    </div>
  );
}
