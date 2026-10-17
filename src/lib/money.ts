// Store and calculate integer paise, avoiding floating-point currency arithmetic.
export function toPaise(value: string): number | null {
  const text = value.trim();
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return null;
  const [rupees, fraction = ""] = text.split(".");
  const amount = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  return amount <= 100_000_000 ? amount : null;
}

export function toRupees(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function money(paise: number, language: "en" | "hi"): string {
  return new Intl.NumberFormat(language === "hi" ? "hi-IN" : "en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(paise / 100);
}
