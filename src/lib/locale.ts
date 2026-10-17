import type { Language } from "./i18n";

export function localeFor(language: Language): string {
  if (language === "hi") return "hi-IN";
  if (language === "pa") return "pa-IN";
  return "en-IN";
}
