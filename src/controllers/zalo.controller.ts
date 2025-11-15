import { Request, Response } from 'express';
import { nluService } from '../services/1_nlu.service';
import { calendarService } from '../services/2_calendar.service';
import { imageService } from '../services/3_image.service';
import { zaloService } from '../services/4_zalo.service';
import { Intent } from '../types';

class ZaloController {
  /**
   * Handle Zalo webhook events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Step 1: Verify signature
      const signature = req.headers['x-zalo-signature'] as string;
      const body = JSON.stringify(req.body);

      if (!signature || !zaloService.verifySignature(body, signature)) {
        console.error('[Webhook] Invalid signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }

      // Step 2: Respond immediately to Zalo (prevent retry)
      res.status(200).json({ success: true });

      // Step 3: Process event asynchronously
      const event = req.body;
      console.log('[Webhook] Received event:', JSON.stringify(event, null, 2));

      // Only handle user_send_text events
      if (event.event_name === 'user_send_text' && event.message?.text) {
        const userId = event.sender?.id || event.user_id_by_app;
        const messageText = event.message.text;

        if (userId && messageText) {
          // Process in background
          this.processUserMessage(userId, messageText).catch((error) => {
            console.error('[Webhook] Process message error:', error);
          });
        }
      }
    } catch (error) {
      console.error('[Webhook] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Process user message (async)
   */
  private async processUserMessage(userId: string, messageText: string): Promise<void> {
    try {
      console.log(`[Webhook] Processing message from ${userId}: "${messageText}"`);

      // Send typing indicator for better UX
      await zaloService.sendTypingIndicator(userId);

      // Step 1: Parse intent using NLU
      const intent = await nluService.parseIntent(messageText);
      console.log(`[Webhook] Parsed intent:`, intent);

      // Step 2: Handle intent
      await this.handleIntent(userId, intent);
    } catch (error) {
      console.error('[Webhook] Process user message error:', error);
      await zaloService.sendTextMessage(
        userId,
        'Xin lỗi, bot đang gặp sự cố. Vui lòng thử lại sau! 😔'
      );
    }
  }

  /**
   * Handle different intent types
   */
  private async handleIntent(userId: string, intent: Intent): Promise<void> {
    switch (intent.intent) {
      case 'GET_TODAY_INFO':
        await this.handleGetTodayInfo(userId);
        break;

      case 'GET_MONTH_CALENDAR':
        await this.handleGetMonthCalendar(userId, intent.month, intent.year);
        break;

      case 'GET_HOLIDAY_COUNTDOWN':
        await this.handleGetHolidayCountdown(userId, intent.holidayName);
        break;

      case 'GET_HOLIDAY_LIST':
        await this.handleGetHolidayList(userId);
        break;

      case 'UNKNOWN':
      default:
        await this.handleUnknown(userId);
        break;
    }
  }

  /**
   * Handle GET_TODAY_INFO intent
   */
  private async handleGetTodayInfo(userId: string): Promise<void> {
    const todayInfo = calendarService.getTodayInfo();
    const text = calendarService.formatDayInfoText(todayInfo);

    await zaloService.sendTextMessage(userId, text);
  }

  /**
   * Handle GET_MONTH_CALENDAR intent
   */
  private async handleGetMonthCalendar(userId: string, month: number, year: number): Promise<void> {
    try {
      // Get calendar data
      const calendar = calendarService.getMonthData(month, year);

      // Generate image
      const imageBuffer = await imageService.generateCalendarImage(calendar);

      // Send image
      const success = await zaloService.sendImageMessage(userId, imageBuffer);

      if (!success) {
        await zaloService.sendTextMessage(
          userId,
          `Không thể tạo lịch tháng ${month}/${year}. Vui lòng thử lại! 😔`
        );
      }
    } catch (error) {
      console.error('[Webhook] Get month calendar error:', error);
      await zaloService.sendTextMessage(
        userId,
        `Lỗi khi tạo lịch tháng ${month}/${year}. Vui lòng thử lại! 😔`
      );
    }
  }

  /**
   * Handle GET_HOLIDAY_COUNTDOWN intent
   */
  private async handleGetHolidayCountdown(userId: string, holidayName: string): Promise<void> {
    const countdown = calendarService.getHolidayCountdown(holidayName);

    if (!countdown) {
      await zaloService.sendTextMessage(
        userId,
        `Không tìm thấy thông tin về "${holidayName}". Bạn có thể gõ "danh sách lễ" để xem tất cả các ngày lễ.`
      );
      return;
    }

    const text = [
      `🎉 ${countdown.name}`,
      `📅 Ngày: ${countdown.nextDate.day}/${countdown.nextDate.month}/${countdown.nextDate.year}`,
      `⏳ Còn ${countdown.daysRemaining} ngày nữa`,
    ].join('\n');

    await zaloService.sendTextMessage(userId, text);
  }

  /**
   * Handle GET_HOLIDAY_LIST intent
   */
  private async handleGetHolidayList(userId: string): Promise<void> {
    const holidays = calendarService.getAllHolidays();

    const lines = ['📜 DANH SÁCH NGÀY LỄ\n'];

    // Group by type
    const lunarHolidays = holidays.filter((h) => h.type === 'lunar');
    const solarHolidays = holidays.filter((h) => h.type === 'solar');

    lines.push('🌙 Lễ Âm lịch:');
    lunarHolidays.forEach((h) => {
      lines.push(`  • ${h.name} (${h.date} ÂL)`);
    });

    lines.push('\n🌞 Lễ Dương lịch:');
    solarHolidays.forEach((h) => {
      lines.push(`  • ${h.name} (${h.date})`);
    });

    lines.push('\n💡 Gõ "Tết còn mấy ngày" để đếm ngược đến ngày lễ!');

    await zaloService.sendTextMessage(userId, lines.join('\n'));
  }

  /**
   * Handle UNKNOWN intent
   */
  private async handleUnknown(userId: string): Promise<void> {
    const helpText = `Xin chào! 👋 Tôi là Bot Lịch Việt.

Bạn có thể hỏi tôi:
• "Hôm nay ngày mấy?" - Xem thông tin ngày hôm nay
• "Xem lịch tháng 12" - Xem lịch cả tháng
• "Tết còn mấy ngày?" - Đếm ngược đến ngày lễ
• "Danh sách ngày lễ" - Xem tất cả ngày lễ

Hãy thử hỏi tôi nhé! 😊`;

    await zaloService.sendTextMessage(userId, helpText);
  }
}

export const zaloController = new ZaloController();
