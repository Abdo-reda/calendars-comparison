import type { IDay } from "../interfaces/dayInterface";

const ISLAMIC_LOCALE = "en-SA-u-ca-islamic-umalqura";
const miladyMonthFormatter = new Intl.DateTimeFormat("default", { month: "long" });
const hijriMonthFormatter = new Intl.DateTimeFormat(ISLAMIC_LOCALE, { month: "long" });
const hijiriLocaleFormatter = new Intl.DateTimeFormat(ISLAMIC_LOCALE, { dateStyle: "short" });
export const hijriPartsFormatter = new Intl.DateTimeFormat(ISLAMIC_LOCALE, { year: "numeric", month: "2-digit", day: "2-digit" });

const currentYear = new Date().getUTCFullYear();
const miladyMonthNames = Array.from({ length: 12 }, (_, i) => miladyMonthFormatter.format(new Date(currentYear, i, 1)));
const hijriMonthNames = Array.from({ length: 12 }, (_, i) => hijriMonthFormatter.format(new Date(currentYear, i, 1)));

export function createMiladyDay(date: Date): IDay {
  return {
    locale: date.toLocaleDateString(),
    short: date.toISOString().split("T")[0],
    month: miladyMonthNames[date.getMonth()],
    isStartOfMonth: date.getDate() === 1,
    isStartOfWeek: date.getDay() === 0,
  };
}

export function createHijriDay(date: Date): IDay | null {
  const hijriDate = Object.fromEntries(hijriPartsFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    locale: hijiriLocaleFormatter.format(date),
    short: `${hijriDate.year}-${hijriDate.month}-${hijriDate.day}`,
    month: hijriMonthNames[date.getMonth()],
    isStartOfMonth: +hijriDate.day === 1,
    isStartOfWeek: date.getDay() === 0,
  };
}
