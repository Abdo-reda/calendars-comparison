export interface IDay {
  locale: string;
  short: string;
  month: string;
  // monthDays: number;
  isStartOfMonth: boolean;
  isStartOfWeek: boolean;
}

export interface ICalendarDay {
  id: string;
  miladyDay: IDay;
  hijriDay: IDay | null;
}
