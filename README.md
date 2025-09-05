# Buery - NFT Collection Manager

Приложение для управления NFT коллекциями с автоматическим обновлением цен оферов.

## Требования

- Docker и Docker Compose
- Node.js 20+ (для локальной разработки)

## Настройка

1. Скопируйте файл `env.example` в `.env`:
```bash
cp env.example .env
```

2. Заполните переменные окружения в файле `.env`:
```env
PORTALS_KEY_PASSWORD=your_password_here
USER_ID=your_user_id_here
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL="file:./prisma/collections.db"
```

## Запуск с Docker

1. Соберите и запустите контейнер:
```bash
docker-compose up --build
```

2. Для запуска в фоновом режиме:
```bash
docker-compose up -d --build
```

3. Для остановки:
```bash
docker-compose down
```

## Локальная разработка

1. Установите зависимости:
```bash
npm install
```

2. Сгенерируйте Prisma клиент:
```bash
npm run db:generate
```

3. Инициализируйте базу данных:
```bash
npm run db:push
```

4. Запустите приложение:
```bash
npm start
```

## Управление базой данных

### Через npm скрипты:
```bash
npm run db:generate  # Генерация Prisma клиента
npm run db:push      # Применение схемы к базе данных
npm run db:studio    # Открытие Prisma Studio
npm run db:migrate   # Создание миграции
```

### Через db-manager:
```bash
# Добавить коллекцию
node db-manager collection add {"collectionId": "collection_id"}

# Удалить коллекцию
node db-manager collection remove {"collectionId": "collection_id"}

# Получить все коллекции
node db-manager collection list

# Очистить все коллекции
node db-manager collection clear
```

## Структура проекта

- `index.js` - Основной файл приложения
- `database.js` - Модуль для работы с базой данных
- `db-manager.js` - CLI для управления базой данных
- `telegram-bot.js` - Telegram бот
- `prisma/` - Схема базы данных и миграции
- `libs/` - Вспомогательные модули

## Решение проблем

### Ошибка "@prisma/client did not initialize yet"

Эта ошибка возникает, когда Prisma клиент не был сгенерирован. Решение:

1. Для Docker - убедитесь, что в Dockerfile есть команда `RUN npx prisma generate`
2. Для локальной разработки - выполните `npm run db:generate`

### Проблемы с базой данных

1. Убедитесь, что переменная `DATABASE_URL` правильно настроена
2. Выполните `npm run db:push` для применения схемы
3. Проверьте права доступа к файлу базы данных
