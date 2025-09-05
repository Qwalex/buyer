const { Telegraf } = require('telegraf');
require('dotenv').config();

class TelegramBot {
  constructor() {
    this.bot = null;
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.isRunning = false;
  }

  // Инициализация бота
  init() {
    if (!this.token) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return false;
    }

    try {
      this.bot = new Telegraf(this.token);
      this.setupCommands();
      console.log('✅ Telegram бот инициализирован');
      return true;
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram бота:', error.message);
      return false;
    }
  }

  // Настройка команд и обработчиков
  setupCommands() {
    // Команда /start
    this.bot.start((ctx) => {
      const welcomeMessage = `
🤖 Добро пожаловать!

Я простой Telegram бот для вашего проекта.

Доступные команды:
/start - Показать это приветствие
/help - Справка по командам
/status - Статус бота

Для связи с разработчиком используйте команду /contact
      `;
      
      ctx.reply(welcomeMessage);
      console.log(`👤 Пользователь ${ctx.from.username || ctx.from.first_name} запустил бота`);
    });

    // Команда /help
    this.bot.help((ctx) => {
      const helpMessage = `
📋 Справка по командам:

/start - Начать работу с ботом
/help - Показать эту справку
/status - Проверить статус бота
/contact - Связаться с разработчиком

Бот находится в разработке. Скоро появятся новые функции!
      `;
      
      ctx.reply(helpMessage);
    });

    // Команда /status
    this.bot.command('status', (ctx) => {
      const statusMessage = `
🟢 Статус бота: Активен
⏰ Время работы: ${this.getUptime()}
📊 Версия: 1.0.0
🔧 Статус: В разработке
      `;
      
      ctx.reply(statusMessage);
    });

    // Команда /contact
    this.bot.command('contact', (ctx) => {
      const contactMessage = `
📞 Контактная информация:

Для связи с разработчиком:
• GitHub: [ваш-профиль]
• Email: [ваш-email]
• Telegram: @[ваш-username]

Или просто напишите сообщение - я передам его разработчику!
      `;
      
      ctx.reply(contactMessage);
    });

    // Обработка обычных сообщений
    this.bot.on('text', (ctx) => {
      const userMessage = ctx.message.text;
      const userName = ctx.from.username || ctx.from.first_name;
      
      console.log(`💬 Сообщение от ${userName}: ${userMessage}`);
      
      // Простой ответ на сообщения
      ctx.reply(`
👋 Привет, ${userName}!

Я получил ваше сообщение: "${userMessage}"

Пока я умею только отвечать на команды. Используйте /help для просмотра доступных команд.
      `);
    });

    // Обработка ошибок
    this.bot.catch((err, ctx) => {
      console.error('❌ Ошибка в боте:', err);
      ctx.reply('😔 Произошла ошибка. Попробуйте позже или обратитесь к разработчику.');
    });
  }

  // Запуск бота
  async start() {
    if (!this.init()) {
      return false;
    }

    try {
      await this.bot.launch();
      this.isRunning = true;
      this.startTime = new Date();
      
      console.log('🚀 Telegram бот запущен и готов к работе!');
      console.log(`📱 Токен: ${this.token.substring(0, 10)}...`);
      
      // Graceful stop
      process.once('SIGINT', () => this.stop('SIGINT'));
      process.once('SIGTERM', () => this.stop('SIGTERM'));
      
      return true;
    } catch (error) {
      console.error('❌ Ошибка запуска бота:', error.message);
      return false;
    }
  }

  // Остановка бота
  async stop(signal) {
    if (this.bot && this.isRunning) {
      console.log(`\n🛑 Получен сигнал ${signal}, останавливаю бота...`);
      this.bot.stop(signal);
      this.isRunning = false;
      console.log('✅ Бот остановлен');
    }
  }

  // Получить время работы бота
  getUptime() {
    if (!this.startTime) return 'Не запущен';
    
    const uptime = Date.now() - this.startTime.getTime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    return `${hours}ч ${minutes}м ${seconds}с`;
  }

  // Отправить сообщение пользователю
  async sendMessage(chatId, message) {
    if (!this.bot || !this.isRunning) {
      console.error('❌ Бот не запущен');
      return false;
    }

    try {
      await this.bot.telegram.sendMessage(chatId, message);
      console.log(`📤 Сообщение отправлено в чат ${chatId}`);
      return true;
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error.message);
      return false;
    }
  }

  // Получить информацию о боте
  getBotInfo() {
    return {
      isRunning: this.isRunning,
      uptime: this.getUptime(),
      token: this.token ? `${this.token.substring(0, 10)}...` : 'Не установлен'
    };
  }
}

// Создаем единственный экземпляр бота
const telegramBot = new TelegramBot();

// Функция для запуска бота из других модулей
const startTelegramBot = async () => {
  return await telegramBot.start();
};

// Функция для остановки бота
const stopTelegramBot = async (signal) => {
  return await telegramBot.stop(signal);
};

// Функция для запуска бота
const runBot = async () => {
  console.log('🤖 Запуск Telegram бота...');
  
  try {
    const success = await telegramBot.start();
    
    if (success) {
      console.log('✅ Бот успешно запущен!');
      console.log('💡 Для остановки нажмите Ctrl+C');
    } else {
      console.log('❌ Не удалось запустить бота');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при запуске бота:', error);
    process.exit(1);
  }
};

// Обработка сигналов завершения
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаю работу...');
  await telegramBot.stop('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаю работу...');
  await telegramBot.stop('SIGTERM');
  process.exit(0);
});

// Запускаем бота только если файл вызван напрямую
if (require.main === module) {
  runBot();
}

// Экспортируем бота и функции для использования в других модулях
module.exports = {
  telegramBot,
  startTelegramBot,
  stopTelegramBot
};
