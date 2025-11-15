import { Lunar, Solar } from 'lunar-javascript';
import { DayInfo, MonthCalendar, SolarDate, LunarDate, Holiday, HolidayCountdown } from '../types';
import {
  formatSolarDate,
  formatLunarDate,
  getDayOfWeekName,
  isSpecialLunarDay,
  daysBetween,
  parseDateString,
  solarDateToDate,
  getCurrentSolarDate,
} from '../utils/date.utils';
import holidaysData from '../data/holidays.json';

class CalendarService {
  private holidays: Holiday[];

  constructor() {
    this.holidays = holidaysData as Holiday[];
  }

  /**
   * Get today's calendar information
   */
  getTodayInfo(): DayInfo {
    const now = new Date();
    const solar = Solar.fromDate(now);
    const lunar = solar.getLunar();

    return this.createDayInfo(solar, lunar, true);
  }

  /**
   * Get full month calendar data
   */
  getMonthData(month: number, year: number): MonthCalendar {
    const days: DayInfo[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const solar = Solar.fromDate(date);
      const lunar = solar.getLunar();

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push(this.createDayInfo(solar, lunar, isToday));
    }

    return {
      month,
      year,
      days,
    };
  }

  /**
   * Get holiday countdown
   */
  getHolidayCountdown(holidayName: string): HolidayCountdown | null {
    const holiday = this.findHoliday(holidayName);
    if (!holiday) {
      return null;
    }

    const { day, month } = parseDateString(holiday.date);
    const now = new Date();
    const currentYear = now.getFullYear();

    let targetDate: Date;

    if (holiday.type === 'solar') {
      targetDate = new Date(currentYear, month - 1, day);
      // If the date has passed this year, use next year
      if (targetDate < now) {
        targetDate = new Date(currentYear + 1, month - 1, day);
      }
    } else {
      // Lunar holiday
      const lunar = Lunar.fromYmd(currentYear, month, day);
      targetDate = lunar.getSolar().toDate();

      // If the date has passed this year, use next year
      if (targetDate < now) {
        const lunarNextYear = Lunar.fromYmd(currentYear + 1, month, day);
        targetDate = lunarNextYear.getSolar().toDate();
      }
    }

    const daysRemaining = daysBetween(now, targetDate);

    return {
      name: holiday.name,
      daysRemaining,
      nextDate: {
        day: targetDate.getDate(),
        month: targetDate.getMonth() + 1,
        year: targetDate.getFullYear(),
      },
    };
  }

  /**
   * Get all holidays
   */
  getAllHolidays(): Holiday[] {
    return this.holidays;
  }

  /**
   * Create DayInfo object from Solar and Lunar objects
   */
  private createDayInfo(solar: Solar, lunar: Lunar, isToday: boolean): DayInfo {
    const date = solar.toDate();
    const dayOfWeek = date.getDay();

    const solarDate: SolarDate = {
      day: solar.getDay(),
      month: solar.getMonth(),
      year: solar.getYear(),
    };

    const lunarDate: LunarDate = {
      day: lunar.getDay(),
      month: lunar.getMonth(),
      year: lunar.getYear(),
      isLeapMonth: lunar.isLeap(),
    };

    const canChi = {
      day: lunar.getDayInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      year: lunar.getYearInGanZhi(),
    };

    const holiday = this.getHolidayForDate(solarDate, lunarDate);

    return {
      solar: solarDate,
      lunar: lunarDate,
      canChi,
      dayOfWeek,
      isToday,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      isSpecialLunarDay: isSpecialLunarDay(lunarDate.day),
    };
  }

  /**
   * Find holiday by name (fuzzy match)
   */
  private findHoliday(name: string): Holiday | undefined {
    const normalized = name.toLowerCase().trim();
    return this.holidays.find((h) => {
      const holidayName = h.name.toLowerCase();
      return (
        holidayName.includes(normalized) ||
        normalized.includes(holidayName) ||
        h.name === normalized
      );
    });
  }

  /**
   * Get holiday for a specific date
   */
  private getHolidayForDate(solar: SolarDate, lunar: LunarDate): Holiday | undefined {
    const solarDateStr = `${solar.day}-${solar.month}`;
    const lunarDateStr = `${lunar.day}-${lunar.month}`;

    return this.holidays.find((h) => {
      if (h.type === 'solar' && h.date === solarDateStr) {
        return true;
      }
      if (h.type === 'lunar' && h.date === lunarDateStr) {
        return true;
      }
      return false;
    });
  }

  /**
   * Format day info as readable text
   */
  formatDayInfoText(dayInfo: DayInfo): string {
    const lines: string[] = [];

    lines.push(`📅 ${getDayOfWeekName(dayInfo.dayOfWeek)}`);
    lines.push(`🌞 Dương lịch: ${formatSolarDate(dayInfo.solar)}`);
    lines.push(`🌙 Âm lịch: ${formatLunarDate(dayInfo.lunar)}`);
    lines.push(`🎋 Can Chi: ${dayInfo.canChi.day} - Tháng ${dayInfo.canChi.month} - Năm ${dayInfo.canChi.year}`);

    if (dayInfo.isSpecialLunarDay) {
      if (dayInfo.lunar.day === 1) {
        lines.push(`✨ Mồng 1 âm lịch`);
      } else if (dayInfo.lunar.day === 15) {
        lines.push(`🌕 Rằm tháng ${dayInfo.lunar.month}`);
      }
    }

    if (dayInfo.isHoliday && dayInfo.holidayName) {
      lines.push(`🎉 ${dayInfo.holidayName}`);
    }

    return lines.join('\n');
  }
}

export const calendarService = new CalendarService();
