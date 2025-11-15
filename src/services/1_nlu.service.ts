import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';
import { config } from '../config';
import { Intent } from '../types';

class NLUService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private cache: NodeCache;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.geminiModel });
    // Cache with TTL (default 1 hour)
    this.cache = new NodeCache({ stdTTL: config.cacheTtl, checkperiod: 120 });
  }

  /**
   * Parse user message to Intent using Gemini AI
   * Implements caching to avoid rate limits
   */
  async parseIntent(userMessage: string): Promise<Intent> {
    const normalizedMessage = userMessage.toLowerCase().trim();

    // Check cache first
    const cachedIntent = this.cache.get<Intent>(normalizedMessage);
    if (cachedIntent) {
      console.log(`[NLU] Cache hit for: "${userMessage}"`);
      return cachedIntent;
    }

    // Call Gemini API
    console.log(`[NLU] Calling Gemini for: "${userMessage}"`);
    const intent = await this.callGemini(normalizedMessage);

    // Cache the result
    this.cache.set(normalizedMessage, intent);

    return intent;
  }

  /**
   * Call Gemini API to analyze user intent
   */
  private async callGemini(message: string): Promise<Intent> {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const prompt = `Bạn là một AI phân tích ý định (Intent) của người dùng trong chatbot Lịch Việt.

Nhiệm vụ: Đọc tin nhắn của người dùng và trả về JSON với cấu trúc sau:

**Các loại Intent:**

1. GET_TODAY_INFO: Người dùng hỏi thông tin ngày hôm nay (âm lịch, can chi...)
   Ví dụ: "hôm nay", "ngày nay", "hôm nay ngày mấy", "xem ngày hôm nay"
   JSON: {"intent": "GET_TODAY_INFO"}

2. GET_MONTH_CALENDAR: Người dùng muốn xem lịch 1 tháng
   Ví dụ: "xem lịch tháng 12", "lịch tháng 1 năm 2025", "tháng này"
   JSON: {"intent": "GET_MONTH_CALENDAR", "month": 12, "year": 2025}
   Lưu ý:
   - Nếu không nói rõ năm, dùng năm hiện tại (${currentYear})
   - Nếu nói "tháng này", dùng tháng hiện tại (${currentMonth})
   - month phải là số từ 1-12

3. GET_HOLIDAY_COUNTDOWN: Đếm ngược đến ngày lễ
   Ví dụ: "Tết còn mấy ngày", "bao giờ đến Tết", "còn bao lâu nữa Giỗ Tổ"
   JSON: {"intent": "GET_HOLIDAY_COUNTDOWN", "holidayName": "Tết Nguyên Đán"}
   Lưu ý: Chuẩn hóa tên lễ (Tết → Tết Nguyên Đán, Giỗ Tổ → Giỗ Tổ Hùng Vương)

4. GET_HOLIDAY_LIST: Liệt kê các ngày lễ
   Ví dụ: "có những ngày lễ nào", "danh sách ngày lễ"
   JSON: {"intent": "GET_HOLIDAY_LIST"}

5. UNKNOWN: Không hiểu hoặc không liên quan đến lịch
   JSON: {"intent": "UNKNOWN"}

**Quy tắc:**
- CHỈ trả về JSON, KHÔNG giải thích
- Phải là JSON hợp lệ
- Phân tích chính xác ý định

Tin nhắn người dùng: "${message}"

Trả về JSON:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      // Extract JSON from response (remove markdown code blocks if present)
      let jsonText = text;
      if (text.includes('```json')) {
        const match = text.match(/```json\n(.*?)\n```/s);
        if (match) {
          jsonText = match[1];
        }
      } else if (text.includes('```')) {
        const match = text.match(/```\n(.*?)\n```/s);
        if (match) {
          jsonText = match[1];
        }
      }

      const intent: Intent = JSON.parse(jsonText);
      return this.validateIntent(intent);
    } catch (error) {
      console.error('[NLU] Gemini API error:', error);
      // Fallback to simple pattern matching
      return this.fallbackPatternMatching(message);
    }
  }

  /**
   * Validate and sanitize intent from Gemini
   */
  private validateIntent(intent: Intent): Intent {
    // Validate month and year for GET_MONTH_CALENDAR
    if (intent.intent === 'GET_MONTH_CALENDAR') {
      const month = intent.month;
      const year = intent.year;

      if (month < 1 || month > 12) {
        return { intent: 'UNKNOWN' };
      }

      if (year < 1900 || year > 2100) {
        return { intent: 'UNKNOWN' };
      }
    }

    return intent;
  }

  /**
   * Fallback pattern matching if Gemini fails or is rate-limited
   */
  private fallbackPatternMatching(message: string): Intent {
    const msg = message.toLowerCase().trim();

    // GET_TODAY_INFO patterns
    if (
      msg.includes('hôm nay') ||
      msg.includes('ngày nay') ||
      msg === 'nay' ||
      msg === 'today'
    ) {
      return { intent: 'GET_TODAY_INFO' };
    }

    // GET_HOLIDAY_LIST patterns
    if (
      msg.includes('danh sách') ||
      msg.includes('các ngày lễ') ||
      msg.includes('có những lễ')
    ) {
      return { intent: 'GET_HOLIDAY_LIST' };
    }

    // GET_HOLIDAY_COUNTDOWN patterns
    if (
      (msg.includes('tết') && (msg.includes('còn') || msg.includes('bao giờ'))) ||
      (msg.includes('lễ') && (msg.includes('còn') || msg.includes('bao giờ')))
    ) {
      let holidayName = 'Tết Nguyên Đán'; // Default to Tet

      if (msg.includes('giỗ tổ') || msg.includes('hùng vương')) {
        holidayName = 'Giỗ Tổ Hùng Vương';
      } else if (msg.includes('trung thu')) {
        holidayName = 'Tết Trung Thu';
      } else if (msg.includes('vu lan')) {
        holidayName = 'Vu Lan';
      }

      return { intent: 'GET_HOLIDAY_COUNTDOWN', holidayName };
    }

    // GET_MONTH_CALENDAR patterns
    if (msg.includes('lịch') || msg.includes('tháng')) {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Try to extract month number
      const monthMatch = msg.match(/tháng\s*(\d{1,2})/);
      const month = monthMatch ? parseInt(monthMatch[1], 10) : currentMonth;

      // Try to extract year
      const yearMatch = msg.match(/năm\s*(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;

      if (month >= 1 && month <= 12) {
        return { intent: 'GET_MONTH_CALENDAR', month, year };
      }
    }

    return { intent: 'UNKNOWN' };
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.flushAll();
    console.log('[NLU] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
    };
  }
}

export const nluService = new NLUService();
