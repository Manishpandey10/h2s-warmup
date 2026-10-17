import { isRealDate } from "./dates";

export function shiftMonth(month: string, offset: number): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, value - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function calendarDays(month: string): Array<string | null> {
  const [year, value] = month.split("-").map(Number);
  const firstWeekday = (new Date(Date.UTC(year, value - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, value, 0)).getUTCDate();
  const days: Array<string | null> = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function dateAllowed(value: string, min: string, max: string): boolean {
  return isRealDate(value) && value >= min && value <= max;
}

export function monthAllowed(value: string, min: string, max: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && value >= min.slice(0, 7) && value <= max.slice(0, 7);
}
