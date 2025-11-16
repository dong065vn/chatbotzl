import { Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { nluService } from '../services/1_nlu.service';
import { calendarService } from '../services/2_calendar.service';
import { imageService } from '../services/3_image.service';
import { telegramService } from '../services/4_telegram.service';
import { Intent } from '../types';

class TelegramController {
  /**
   * Handle incoming text messages
   */
  async handleMessage(ctx: Context<Update>): Promise<void> {
    try {
      // Extract message text and chat ID
      if (!ctx.message || !('text' in ctx.message)) {
        return;
      }

      const messageText = ctx.message.text;
      const chatId = ctx.chat!.id;
      const userId = ctx.from!.id;

      console.log(`[Telegram] Message from ${userId} (chat ${chatId}): "${messageText}"`);

      // Send typing action for better UX
      await telegramService.sendTypingAction(chatId);

      // Step 1: Parse intent using NLU
      const intent = await nluService.parseIntent(messageText);
      console.log(`[Telegram] Parsed intent:`, intent);

      // Step 2: Handle intent
      await this.handleIntent(chatId, intent);
    } catch (error) {
      console.error('[Telegram] Handle message error:', error);
      await ctx.reply(
        '❌ Xin lỗi, bot đang gặp sự cố. Vui lòng thử lại sau!'
      );
    }
  }

  /**
   * Handle /start command
   */
  async handleStart(ctx: Context<Update>): Promise<void> {
    const welcomeText = `
🎋 <b>Xin chào! Tôi là Bot Lịch Việt</b>

Tôi có thể giúp bạn:
• Xem thông tin ngày hôm nay (Âm/Dương lịch, Can Chi)
• Tạo lịch tháng với hình ảnh đẹp
• Đếm ngược đến các ngày lễ
• Xem danh sách ngày lễ Việt Nam

<b>📝 Ví dụ câu hỏi:</b>
▫️ "Hôm nay ngày mấy?"
▫️ "Xem lịch tháng 12"
▫️ "Tết còn mấy ngày?"
▫️ "Danh sách ngày lễ"

Hãy thử hỏi tôi nhé! 😊
    `.trim();

    await ctx.reply(welcomeText, { parse_mode: 'HTML' });
  }

  /**
   * Handle /help command
   */
  async handleHelp(ctx: Context<Update>): Promise<void> {
    const helpText = `
📚 <b>HƯỚNG DẪN SỬ DỤNG</b>

<b>🔹 Xem thông tin ngày:</b>
"Hôm nay", "Ngày hôm nay", "Hôm nay ngày mấy?"

<b>🔹 Xem lịch tháng (ảnh):</b>
"Xem lịch tháng 12"
"Lịch tháng 1 năm 2025"
"Tháng này"

<b>🔹 Đếm ngược ngày lễ:</b>
"Tết còn mấy ngày?"
"Bao giờ đến Giỗ Tổ?"
"Vu Lan còn bao lâu?"

<b>🔹 Danh sách ngày lễ:</b>
"Danh sách lễ"
"Các ngày lễ"

💡 <i>Bot hiểu ngôn ngữ tự nhiên, bạn có thể hỏi thoải mái!</i>
    `.trim();

    await ctx.reply(helpText, { parse_mode: 'HTML' });
  }

  /**
   * Handle different intent types
   */
  private async handleIntent(chatId: number, intent: Intent): Promise<void> {
    switch (intent.intent) {
      case 'GET_TODAY_INFO':
        await this.handleGetTodayInfo(chatId);
        break;

      case 'GET_MONTH_CALENDAR':
        await this.handleGetMonthCalendar(chatId, intent.month, intent.year);
        break;

      case 'GET_HOLIDAY_COUNTDOWN':
        await this.handleGetHolidayCountdown(chatId, intent.holidayName);
        break;

      case 'GET_HOLIDAY_LIST':
        await this.handleGetHolidayList(chatId);
        break;

      case 'UNKNOWN':
      default:
        await this.handleUnknown(chatId);
        break;
    }
  }

  /**
   * Handle GET_TODAY_INFO intent
   */
  private async handleGetTodayInfo(chatId: number): Promise<void> {
    const todayInfo = calendarService.getTodayInfo();
    const text = calendarService.formatDayInfoText(todayInfo);

    await telegramService.sendTextMessage(chatId, text);
  }

  /**
   * Handle GET_MONTH_CALENDAR intent
   */
  private async handleGetMonthCalendar(
    chatId: number,
    month: number,
    year: number
  ): Promise<void> {
    try {
      // Send upload photo action
      await telegramService.sendUploadPhotoAction(chatId);

      // Get calendar data
      const calendar = calendarService.getMonthData(month, year);

      // Generate image
      const imageBuffer = await imageService.generateCalendarImage(calendar);

      // Send photo
      const caption = `📅 <b>Lịch tháng ${month}/${year}</b>\n🌙 Lịch Việt - Âm Dương`;
      const success = await telegramService.sendPhotoMessage(
        chatId,
        imageBuffer,
        caption
      );

      if (!success) {
        await telegramService.sendTextMessage(
          chatId,
          `❌ Không thể tạo lịch tháng ${month}/${year}. Vui lòng thử lại!`
        );
      }
    } catch (error) {
      console.error('[Telegram] Get month calendar error:', error);
      await telegramService.sendTextMessage(
        chatId,
        `❌ Lỗi khi tạo lịch tháng ${month}/${year}. Vui lòng thử lại!`
      );
    }
  }

  /**
   * Handle GET_HOLIDAY_COUNTDOWN intent
   */
  private async handleGetHolidayCountdown(
    chatId: number,
    holidayName: string
  ): Promise<void> {
    const countdown = calendarService.getHolidayCountdown(holidayName);

    if (!countdown) {
      await telegramService.sendTextMessage(
        chatId,
        `❓ Không tìm thấy thông tin về "<b>${holidayName}</b>".\n\n💡 Gõ /help để xem danh sách ngày lễ.`
      );
      return;
    }

    const text = `
🎉 <b>${countdown.name}</b>

📅 Ngày: ${countdown.nextDate.day}/${countdown.nextDate.month}/${countdown.nextDate.year}
⏳ Còn <b>${countdown.daysRemaining} ngày</b> nữa
    `.trim();

    await telegramService.sendTextMessage(chatId, text);
  }

  /**
   * Handle GET_HOLIDAY_LIST intent
   */
  private async handleGetHolidayList(chatId: number): Promise<void> {
    const holidays = calendarService.getAllHolidays();

    const lines = ['📜 <b>DANH SÁCH NGÀY LỄ VIỆT NAM</b>\n'];

    // Group by type
    const lunarHolidays = holidays.filter((h) => h.type === 'lunar');
    const solarHolidays = holidays.filter((h) => h.type === 'solar');

    lines.push('🌙 <b>Lễ Âm lịch:</b>');
    lunarHolidays.forEach((h) => {
      lines.push(`  • ${h.name} <i>(${h.date} ÂL)</i>`);
    });

    lines.push('\n🌞 <b>Lễ Dương lịch:</b>');
    solarHolidays.forEach((h) => {
      lines.push(`  • ${h.name} <i>(${h.date})</i>`);
    });

    lines.push('\n💡 Gõ "Tết còn mấy ngày" để đếm ngược đến ngày lễ!');

    await telegramService.sendTextMessage(chatId, lines.join('\n'));
  }

  /**
   * Handle UNKNOWN intent
   */
  private async handleUnknown(chatId: number): Promise<void> {
    const helpText = `
❓ <b>Tôi chưa hiểu câu hỏi của bạn</b>

Bạn có thể hỏi tôi:
• "Hôm nay ngày mấy?" - Xem thông tin ngày hôm nay
• "Xem lịch tháng 12" - Xem lịch cả tháng
• "Tết còn mấy ngày?" - Đếm ngược đến ngày lễ
• "Danh sách ngày lễ" - Xem tất cả ngày lễ

Hoặc gõ /help để xem hướng dẫn chi tiết! 😊
    `.trim();

    await telegramService.sendTextMessage(chatId, helpText);
  }
}

export const telegramController = new TelegramController();
