import './config'; // Load environment variables
import { telegramService } from './services/4_telegram.service';
import { telegramController } from './controllers/telegram.controller';

async function main() {
  console.log('🚀 Starting Telegram Lunar Calendar Bot...');

  // Get bot instance
  const bot = telegramService.getBot();

  // Register command handlers
  bot.command('start', (ctx) => telegramController.handleStart(ctx));
  bot.command('help', (ctx) => telegramController.handleHelp(ctx));

  // Register text message handler
  bot.on('text', (ctx) => telegramController.handleMessage(ctx));

  // Launch bot
  await telegramService.launch();

  console.log('✅ Bot is running!');
  console.log('💬 Send messages to your bot on Telegram to test.');
}

// Start the bot
main().catch((error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});
