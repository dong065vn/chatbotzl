import { createCanvas, registerFont } from 'canvas';
import NodeCache from 'node-cache';
import { MonthCalendar, DayInfo } from '../types';
import { getDayOfWeekName } from '../utils/date.utils';

class ImageService {
  private cache: NodeCache;

  // Canvas dimensions
  private readonly WIDTH = 1200;
  private readonly HEIGHT = 1400;

  // Grid settings
  private readonly CELL_WIDTH = 150;
  private readonly CELL_HEIGHT = 180;
  private readonly START_X = 60;
  private readonly START_Y = 200;

  // Colors
  private readonly COLORS = {
    background: '#FFFFFF',
    headerBg: '#4A90E2',
    headerText: '#FFFFFF',
    gridLine: '#DDDDDD',
    normalText: '#333333',
    sundayText: '#E74C3C',
    lunarText: '#888888',
    todayBg: '#FFE5E5',
    specialLunarBg: '#FFF9E6',
    holidayBg: '#E8F5E9',
    weekdayHeader: '#666666',
  };

  constructor() {
    // Cache calendar images for 24 hours
    this.cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
  }

  /**
   * Generate calendar image for a month
   */
  async generateCalendarImage(calendar: MonthCalendar): Promise<Buffer> {
    const cacheKey = `calendar-${calendar.month}-${calendar.year}`;

    // Check cache
    const cached = this.cache.get<Buffer>(cacheKey);
    if (cached) {
      console.log(`[Image] Cache hit for ${cacheKey}`);
      return cached;
    }

    console.log(`[Image] Generating calendar for ${calendar.month}/${calendar.year}`);

    // Create canvas
    const canvas = createCanvas(this.WIDTH, this.HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = this.COLORS.background;
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

    // Draw header (Month Year)
    this.drawHeader(ctx, calendar.month, calendar.year);

    // Draw weekday headers (T2, T3, ..., CN)
    this.drawWeekdayHeaders(ctx);

    // Draw calendar grid
    this.drawCalendarGrid(ctx, calendar);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    // Cache the result
    this.cache.set(cacheKey, buffer);

    return buffer;
  }

  /**
   * Draw header with month and year
   */
  private drawHeader(ctx: any, month: number, year: number): void {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];

    // Header background
    ctx.fillStyle = this.COLORS.headerBg;
    ctx.fillRect(0, 0, this.WIDTH, 150);

    // Month text
    ctx.fillStyle = this.COLORS.headerText;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${monthNames[month - 1]} ${year}`, this.WIDTH / 2, 70);

    // Subtitle
    ctx.font = '20px Arial';
    ctx.fillText('Lịch Việt - Âm Dương', this.WIDTH / 2, 110);
  }

  /**
   * Draw weekday headers (Mon-Sun)
   */
  private drawWeekdayHeaders(ctx: any): void {
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';

    for (let i = 0; i < 7; i++) {
      const x = this.START_X + i * this.CELL_WIDTH + this.CELL_WIDTH / 2;
      const y = this.START_Y - 20;

      // Highlight Sunday in red
      ctx.fillStyle = i === 6 ? this.COLORS.sundayText : this.COLORS.weekdayHeader;
      ctx.fillText(weekdays[i], x, y);
    }
  }

  /**
   * Draw calendar grid with all days
   */
  private drawCalendarGrid(ctx: any, calendar: MonthCalendar): void {
    const firstDay = new Date(calendar.year, calendar.month - 1, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday=0 to Sunday=6

    let dayIndex = 0;

    // Draw 6 rows (weeks)
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const cellX = this.START_X + col * this.CELL_WIDTH;
        const cellY = this.START_Y + row * this.CELL_HEIGHT;

        // Draw cell border
        ctx.strokeStyle = this.COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, this.CELL_WIDTH, this.CELL_HEIGHT);

        // Skip days before month starts
        if (row === 0 && col < adjustedFirstDay) {
          continue;
        }

        // Skip days after month ends
        if (dayIndex >= calendar.days.length) {
          continue;
        }

        const dayInfo = calendar.days[dayIndex];
        this.drawDayCell(ctx, cellX, cellY, dayInfo);

        dayIndex++;
      }
    }
  }

  /**
   * Draw individual day cell
   */
  private drawDayCell(ctx: any, x: number, y: number, dayInfo: DayInfo): void {
    const centerX = x + this.CELL_WIDTH / 2;
    const centerY = y + this.CELL_HEIGHT / 2;

    // Determine background color
    let bgColor = null;
    if (dayInfo.isToday) {
      bgColor = this.COLORS.todayBg;
    } else if (dayInfo.isHoliday) {
      bgColor = this.COLORS.holidayBg;
    } else if (dayInfo.isSpecialLunarDay) {
      bgColor = this.COLORS.specialLunarBg;
    }

    // Draw background if special
    if (bgColor) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, this.CELL_WIDTH, this.CELL_HEIGHT);
    }

    // Draw solar date (large, top)
    const solarColor = dayInfo.dayOfWeek === 0 ? this.COLORS.sundayText : this.COLORS.normalText;
    ctx.fillStyle = solarColor;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dayInfo.solar.day.toString(), centerX, y + 50);

    // Draw lunar date (small, below solar)
    ctx.fillStyle = this.COLORS.lunarText;
    ctx.font = '14px Arial';
    const lunarText = `${dayInfo.lunar.day}/${dayInfo.lunar.month}`;
    ctx.fillText(lunarText, centerX, y + 80);

    // Draw special lunar day indicator
    if (dayInfo.isSpecialLunarDay) {
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#D4A017';
      if (dayInfo.lunar.day === 1) {
        ctx.fillText('Mồng 1', centerX, y + 100);
      } else if (dayInfo.lunar.day === 15) {
        ctx.fillText('Rằm', centerX, y + 100);
      }
    }

    // Draw holiday name (if exists, at bottom)
    if (dayInfo.isHoliday && dayInfo.holidayName) {
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = '#E74C3C';
      const maxWidth = this.CELL_WIDTH - 10;

      // Truncate long holiday names
      let holidayText = dayInfo.holidayName;
      if (ctx.measureText(holidayText).width > maxWidth) {
        while (ctx.measureText(holidayText + '...').width > maxWidth && holidayText.length > 0) {
          holidayText = holidayText.slice(0, -1);
        }
        holidayText += '...';
      }

      ctx.fillText(holidayText, centerX, y + this.CELL_HEIGHT - 15);
    }

    // Draw today indicator
    if (dayInfo.isToday) {
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, this.CELL_WIDTH - 4, this.CELL_HEIGHT - 4);
    }
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[Image] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number } {
    return {
      keys: this.cache.keys().length,
    };
  }
}

export const imageService = new ImageService();
