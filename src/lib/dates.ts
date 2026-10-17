export function indiaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((value) => value.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function monthBounds(month: string) {
  const [year, value] = month.split("-").map(Number);
  const nextYear = value === 12 ? year + 1 : year;
  const nextMonth = value === 12 ? 1 : value + 1;
  return { start: `${month}-01`, end: `${nextYear}-${String(nextMonth).padStart(2, "0")}-01` };
}

export function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
