// Intent types for NLU
export type Intent =
  | { intent: 'GET_TODAY_INFO' }
  | { intent: 'GET_MONTH_CALENDAR'; month: number; year: number }
  | { intent: 'GET_HOLIDAY_COUNTDOWN'; holidayName: string }
  | { intent: 'GET_HOLIDAY_LIST' }
  | { intent: 'UNKNOWN' };

// Calendar types
export interface LunarDate {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
}

export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

export interface DayInfo {
  solar: SolarDate;
  lunar: LunarDate;
  canChi: {
    day: string;
    month: string;
    year: string;
  };
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isSpecialLunarDay: boolean; // Rằm, Mồng 1
}

export interface MonthCalendar {
  month: number;
  year: number;
  days: DayInfo[];
}

// Holiday types
export interface Holiday {
  name: string;
  type: 'lunar' | 'solar';
  date: string; // Format: "DD-MM"
  description: string;
}

export interface HolidayCountdown {
  name: string;
  daysRemaining: number;
  nextDate: SolarDate;
}

// Zalo types
export interface ZaloWebhookEvent {
  app_id: string;
  user_id_by_app: string;
  event_name: string;
  timestamp: string;
  message?: {
    text: string;
    msg_id: string;
  };
  sender?: {
    id: string;
  };
  recipient?: {
    id: string;
  };
}

export interface ZaloMessage {
  recipient: {
    user_id: string;
  };
  message: {
    text?: string;
    attachment?: {
      type: 'template' | 'file';
      payload: {
        template_type?: string;
        elements?: unknown[];
        token?: string; // For uploaded images
      };
    };
  };
}
