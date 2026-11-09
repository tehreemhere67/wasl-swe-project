import { type Locale } from "@/lib/i18n/types";
import { createTranslator } from "@/lib/i18n";

/**
 * IR-03: "The interface shall be available in English and Urdu, with a
 * language switch on every page." Rendered as a small form so it works
 * without JavaScript; the API remembers the choice (LOC-02) and redirects
 * back to the same page.
 */
export function LanguageSwitch({ locale }: { locale: Locale }) {
  const t = createTranslator(locale);
  const target: Locale = locale === "en" ? "ur" : "en";

  return (
    <form action="/api/language" method="post" className="no-print">
      <input type="hidden" name="locale" value={target} />
      <button
        type="submit"
        className="btn btn-ghost btn-sm gap-1.5 rounded-full font-semibold"
        aria-label={`${t("nav.language")}: ${target === "ur" ? "اردو" : "English"}`}
        title={target === "ur" ? "اردو" : "English"}
      >
        <span aria-hidden="true" className="text-ink-400">
          {locale === "en" ? "EN" : "اردو"}
        </span>
        <span aria-hidden="true">⇄</span>
        <span>{locale === "en" ? "اردو" : "EN"}</span>
      </button>
    </form>
  );
}
