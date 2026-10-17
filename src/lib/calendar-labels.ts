import type { Language } from "./i18n";

const monthNames: Record<Language, readonly string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  hi: ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  pa: ["ਜਨਵਰੀ", "ਫ਼ਰਵਰੀ", "ਮਾਰਚ", "ਅਪ੍ਰੈਲ", "ਮਈ", "ਜੂਨ", "ਜੁਲਾਈ", "ਅਗਸਤ", "ਸਤੰਬਰ", "ਅਕਤੂਬਰ", "ਨਵੰਬਰ", "ਦਸੰਬਰ"],
};

const shortWeekdays: Record<Language, readonly string[]> = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  hi: ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"],
  pa: ["ਸੋਮ", "ਮੰਗਲ", "ਬੁੱਧ", "ਵੀਰ", "ਸ਼ੁੱਕਰ", "ਸ਼ਨੀ", "ਐਤ"],
};

const longWeekdays: Record<Language, readonly string[]> = {
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  hi: ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"],
  pa: ["ਸੋਮਵਾਰ", "ਮੰਗਲਵਾਰ", "ਬੁੱਧਵਾਰ", "ਵੀਰਵਾਰ", "ਸ਼ੁੱਕਰਵਾਰ", "ਸ਼ਨੀਵਾਰ", "ਐਤਵਾਰ"],
};

export function calendarMonths(language: Language) {
  return monthNames[language];
}

export function calendarWeekdays(language: Language) {
  return shortWeekdays[language];
}

export function calendarLabel(value: string, language: Language, mode: "date" | "month") {
  const [year, month, day] = value.split("-").map(Number);
  const monthName = monthNames[language][month - 1];
  if (!monthName) return value;
  return mode === "month" ? `${monthName} ${year}` : `${day} ${monthName} ${year}`;
}

export function fullCalendarDate(value: string, language: Language) {
  const date = new Date(`${value}T00:00:00Z`);
  const mondayIndex = (date.getUTCDay() + 6) % 7;
  return `${longWeekdays[language][mondayIndex]}, ${calendarLabel(value, language, "date")}`;
}
