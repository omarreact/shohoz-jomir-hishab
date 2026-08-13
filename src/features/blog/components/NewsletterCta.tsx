import { Mail } from "lucide-react";
import { t } from "@/src/locales";
import { Button } from "@/src/shared/ui/button";

export default function NewsletterCta() {
  return (
    <div className="card-new max-w-3xl mx-auto p-10 text-center relative overflow-hidden group border-t-4 border-t-[var(--accent)]">
      <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
        <Mail size={120} className="text-[var(--accent)]" />
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4">
          {t.newsletter.title}
        </h3>
        <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          {t.newsletter.subtitle}
        </p>

        <form className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <div className="flex-1 relative">
            <input
              type="email"
              placeholder={t.newsletter.placeholder}
              required
              autoComplete="off"
              className="w-full h-12 bg-[var(--bg)] border border-[var(--border)] rounded-full px-6 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-full px-8 font-bold cta-gradient text-[var(--bg)] shadow-md hover:-translate-y-0.5 transition-transform shrink-0"
          >
            {t.newsletter.button}
          </button>
        </form>
      </div>
    </div>
  );
}
