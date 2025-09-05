const { PrismaClient } = require('@prisma/client');

class Database {
  constructor() {
    this.prisma = new PrismaClient();
    this.isConnected = false;
  }

  // Инициализация базы данных
  async init() {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('✅ Подключение к базе данных через Prisma установлено');
    } catch (error) {
      console.error('❌ Ошибка подключения к базе данных:', error.message);
      throw error;
    }
  }

  // Проверка подключения
  async ensureConnected() {
    if (!this.isConnected) {
      await this.init();
    }
  }

  // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ =====

  // Универсальный метод для создания записи
  async create(modelName, data) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].create({ data });
      console.log(`✅ Запись создана в модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка создания записи в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для поиска записей
  async findMany(modelName, where = {}, options = {}) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].findMany({
        where,
        ...options
      });
      console.log(`✅ Найдено ${result.length} записей в модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка поиска записей в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для поиска одной записи
  async findUnique(modelName, where) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].findUnique({ where });
      return result;
    } catch (error) {
      console.error(`❌ Ошибка поиска записи в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для поиска первой записи
  async findFirst(modelName, where = {}) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].findFirst({ where });
      return result;
    } catch (error) {
      console.error(`❌ Ошибка поиска первой записи в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для обновления записи
  async update(modelName, where, data) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].update({
        where,
        data
      });
      console.log(`✅ Запись обновлена в модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка обновления записи в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для обновления или создания записи
  async upsert(modelName, where, create, update) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].upsert({
        where,
        create,
        update
      });
      console.log(`✅ Запись обновлена/создана в модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка upsert записи в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для удаления записи
  async delete(modelName, where) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].delete({ where });
      console.log(`✅ Запись удалена из модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка удаления записи из модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для подсчета записей
  async count(modelName, where = {}) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].count({ where });
      console.log(`📊 В модели '${modelName}' найдено ${result} записей`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка подсчета записей в модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // Универсальный метод для удаления всех записей
  async deleteMany(modelName, where = {}) {
    await this.ensureConnected();
    try {
      const result = await this.prisma[modelName].deleteMany({ where });
      console.log(`✅ Удалено ${result.count} записей из модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка удаления записей из модели '${modelName}':`, error.message);
      throw error;
    }
  }

  // ===== МЕТОДЫ ДЛЯ COLLECTION (обратная совместимость) =====

  // Добавить ID коллекции
  async addCollectionId(collectionId) {
    try {
      const result = await this.upsert('collection', 
        { collectionId },
        { collectionId },
        { collectionId }
      );
      return result;
    } catch (error) {
      console.error('❌ Ошибка добавления ID коллекции:', error.message);
      throw error;
    }
  }

  // Удалить ID коллекции
  async removeCollectionId(collectionId) {
    try {
      const result = await this.delete('collection', { collectionId });
      return result;
    } catch (error) {
      console.error('❌ Ошибка удаления ID коллекции:', error.message);
      throw error;
    }
  }

  // Получить все ID коллекций
  async getAllCollectionIds() {
    try {
      const collections = await this.findMany('collection', {}, {
        orderBy: { createdAt: 'desc' }
      });
      return collections.map(c => c.collectionId);
    } catch (error) {
      console.error('❌ Ошибка получения ID коллекций:', error.message);
      throw error;
    }
  }

  // Проверить существует ли ID коллекции
  async hasCollectionId(collectionId) {
    try {
      const collection = await this.findUnique('collection', { collectionId });
      return !!collection;
    } catch (error) {
      console.error('❌ Ошибка проверки ID коллекции:', error.message);
      throw error;
    }
  }

  // Получить количество коллекций
  async getCollectionCount() {
    try {
      return await this.count('collection');
    } catch (error) {
      console.error('❌ Ошибка подсчета коллекций:', error.message);
      throw error;
    }
  }

  // Очистить все ID коллекций
  async clearAllCollectionIds() {
    try {
      const result = await this.deleteMany('collection');
      return result.count;
    } catch (error) {
      console.error('❌ Ошибка очистки коллекций:', error.message);
      throw error;
    }
  }

  // ===== ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ =====

  // Получить информацию о всех моделях
  async getModelsInfo() {
    await this.ensureConnected();
    try {
      const models = ['collection'];
      const info = {};
      
      for (const model of models) {
        try {
          const count = await this.count(model);
          info[model] = { count };
        } catch (error) {
          info[model] = { error: error.message };
        }
      }
      
      return info;
    } catch (error) {
      console.error('❌ Ошибка получения информации о моделях:', error.message);
      throw error;
    }
  }

  // Выполнить произвольный SQL запрос (для продвинутых случаев)
  async executeRaw(query, params = []) {
    await this.ensureConnected();
    try {
      const result = await this.prisma.$queryRawUnsafe(query, ...params);
      console.log('✅ SQL запрос выполнен');
      return result;
    } catch (error) {
      console.error('❌ Ошибка выполнения SQL запроса:', error.message);
      throw error;
    }
  }

  // Закрыть соединение с базой данных
  async close() {
    try {
      if (this.isConnected) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('✅ Соединение с базой данных закрыто');
      }
    } catch (error) {
      console.error('❌ Ошибка закрытия базы данных:', error.message);
      throw error;
    }
  }
}

// Создаем единственный экземпляр базы данных
const database = new Database();

module.exports = database;