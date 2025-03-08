export interface IDay {
  locale: string;
  short: string;
  month: string;
  isStartOfMonth: boolean;
  isStartOfWeek: boolean;
}

export interface ICalendarDay {
  id: string;
  miladyDay: IDay;
  hijriDay: IDay | null;
}
