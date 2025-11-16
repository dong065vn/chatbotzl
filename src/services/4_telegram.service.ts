import { Telegraf, Context } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { config } from '../config';

class TelegramService {
  private bot: Telegraf<Context<Update>>;

  constructor() {
    this.bot = new Telegraf(config.telegramBotToken);
  }

  /**
   * Get bot instance for setting up handlers
   */
  getBot(): Telegraf<Context<Update>> {
    return this.bot;
  }

  /**
   * Send text message to user
   */
  async sendTextMessage(chatId: number, text: string): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
      });
      console.log(`[Telegram] Text message sent to ${chatId}`);
      return true;
    } catch (error) {
      console.error('[Telegram] Send text message failed:', error);
      return false;
    }
  }

  /**
   * Send photo message to user
   */
  async sendPhotoMessage(
    chatId: number,
    photoBuffer: Buffer,
    caption?: string
  ): Promise<boolean> {
    try {
      await this.bot.telegram.sendPhoto(
        chatId,
        { source: photoBuffer },
        {
          caption: caption || undefined,
          parse_mode: 'HTML',
        }
      );
      console.log(`[Telegram] Photo message sent to ${chatId}`);
      return true;
    } catch (error) {
      console.error('[Telegram] Send photo message failed:', error);
      return false;
    }
  }

  /**
   * Send typing action (chat action)
   */
  async sendTypingAction(chatId: number): Promise<void> {
    try {
      await this.bot.telegram.sendChatAction(chatId, 'typing');
    } catch (error) {
      // Ignore errors for typing action
      console.log('[Telegram] Typing action error (ignored)');
    }
  }

  /**
   * Send upload photo action
   */
  async sendUploadPhotoAction(chatId: number): Promise<void> {
    try {
      await this.bot.telegram.sendChatAction(chatId, 'upload_photo');
    } catch (error) {
      // Ignore errors
      console.log('[Telegram] Upload photo action error (ignored)');
    }
  }

  /**
   * Start bot (long polling)
   */
  async launch(): Promise<void> {
    await this.bot.launch();
    console.log('🚀 Telegram bot launched successfully!');

    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export const telegramService = new TelegramService();
