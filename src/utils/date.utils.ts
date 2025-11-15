import { SolarDate, LunarDate } from '../types';

/**
 * Format date to Vietnamese readable string
 */
export function formatSolarDate(date: SolarDate): string {
  return `${date.day.toString().padStart(2, '0')}/${date.month.toString().padStart(2, '0')}/${date.year}`;
}

export function formatLunarDate(date: LunarDate): string {
  const leapPrefix = date.isLeapMonth ? 'nhuận ' : '';
  return `${date.day}/${leapPrefix}${date.month}/${date.year}`;
}

/**
 * Get day of week name in Vietnamese
 */
export function getDayOfWeekName(dayOfWeek: number): string {
  const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return names[dayOfWeek] || '';
}

/**
 * Check if a lunar day is special (Mồng 1 or Rằm)
 */
export function isSpecialLunarDay(lunarDay: number): boolean {
  return lunarDay === 1 || lunarDay === 15;
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / oneDay);
}

/**
 * Parse date string "DD-MM" to day and month
 */
export function parseDateString(dateStr: string): { day: number; month: number } {
  const [day, month] = dateStr.split('-').map(Number);
  return { day, month };
}

/**
 * Create Date object from SolarDate
 */
export function solarDateToDate(solar: SolarDate): Date {
  return new Date(solar.year, solar.month - 1, solar.day);
}

/**
 * Get current date as SolarDate
 */
export function getCurrentSolarDate(): SolarDate {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}
