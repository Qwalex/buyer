FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем схему Prisma
COPY prisma ./prisma/

# Генерируем Prisma клиент
RUN npx prisma generate

# Копируем остальные файлы
COPY . .

# Создаем директорию для базы данных
RUN mkdir -p ./prisma

# Инициализируем базу данных (если нужно)
# RUN npx prisma db push

CMD ["node", "index.js"]
