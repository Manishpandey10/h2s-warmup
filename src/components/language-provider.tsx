"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type Language } from "@/lib/i18n";

const LanguageContext = createContext<{ language: Language; setLanguage: (value: Language) => void }>({
  language: "en",
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rozmitra-language");
      if (saved === "hi" || saved === "en" || saved === "pa") setLanguage(saved);
    } catch {
      /* The switch still works when browser storage is unavailable. */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function chooseLanguage(value: Language) {
    setLanguage(value);
    try {
      localStorage.setItem("rozmitra-language", value);
    } catch {
      /* Optional persistence. */
    }
  }
  return (
    <LanguageContext.Provider value={{ language, setLanguage: chooseLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return { ...context, t: messages[context.language] };
}
