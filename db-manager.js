const database = require('./database');

class DatabaseManager {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (!this.isInitialized) {
      await database.init();
      this.isInitialized = true;
      console.log('✅ DatabaseManager инициализирован с Prisma');
    }
  }

  // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ =====

  // Добавить запись в любую модель
  async addRecord(modelName, data) {
    await this.init();
    try {
      const result = await database.create(modelName, data);
      console.log(`✅ Запись добавлена в модель '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка добавления записи в модель '${modelName}':`, error.message);
    }
  }

  // Удалить запись из любой модели
  async removeRecord(modelName, where) {
    await this.init();
    try {
      const result = await database.delete(modelName, where);
      console.log(`✅ Запись удалена из модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка удаления записи из модели '${modelName}':`, error.message);
    }
  }

  // Получить записи из любой модели
  async getRecords(modelName, where = {}, options = {}) {
    await this.init();
    try {
      const records = await database.findMany(modelName, where, options);
      console.log(`📋 Получено ${records.length} записей из модели '${modelName}'`);
      return records;
    } catch (error) {
      console.error(`❌ Ошибка получения записей из модели '${modelName}':`, error.message);
      return [];
    }
  }

  // Получить одну запись из любой модели
  async getRecord(modelName, where) {
    await this.init();
    try {
      const record = await database.findUnique(modelName, where);
      return record;
    } catch (error) {
      console.error(`❌ Ошибка получения записи из модели '${modelName}':`, error.message);
      return null;
    }
  }

  // Подсчитать записи в любой модели
  async countRecords(modelName, where = {}) {
    await this.init();
    try {
      const count = await database.count(modelName, where);
      console.log(`📊 В модели '${modelName}' найдено ${count} записей`);
      return count;
    } catch (error) {
      console.error(`❌ Ошибка подсчета записей в модели '${modelName}':`, error.message);
      return 0;
    }
  }

  // Обновить запись в любой модели
  async updateRecord(modelName, where, data) {
    await this.init();
    try {
      const result = await database.update(modelName, where, data);
      console.log(`✅ Запись обновлена в модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка обновления записи в модели '${modelName}':`, error.message);
      return null;
    }
  }

  // Очистить все записи из модели
  async clearModel(modelName) {
    await this.init();
    try {
      const result = await database.deleteMany(modelName, {});
      console.log(`✅ Удалено ${result.count} записей из модели '${modelName}'`);
      return result;
    } catch (error) {
      console.error(`❌ Ошибка очистки модели '${modelName}':`, error.message);
      return null;
    }
  }

  // Показать информацию о всех моделях
  async showModelsInfo() {
    await this.init();
    try {
      const info = await database.getModelsInfo();
      console.log(`\n📊 Информация о моделях:`);
      
      Object.entries(info).forEach(([model, data]) => {
        if (data.error) {
          console.log(`   ${model}: ❌ ${data.error}`);
        } else {
          console.log(`   ${model}: ${data.count} записей`);
        }
      });
      console.log('');
    } catch (error) {
      console.error('❌ Ошибка получения информации о моделях:', error.message);
    }
  }


  // Закрыть соединение
  async close() {
    try {
      await database.close();
      console.log('✅ Соединение с базой данных закрыто');
    } catch (error) {
      console.error('❌ Ошибка закрытия базы данных:', error.message);
    }
  }
}

// Функция для работы с командной строкой
const runCommand = async () => {
  const manager = new DatabaseManager();
  const args = process.argv.slice(2);
  const command = args[0];
  const param1 = args[1];
  const param2 = args[2];
  const param3 = args[3];

  try {
    switch (command) {
      // Универсальные команды для работы с моделями
      case 'models':
        await manager.showModelsInfo();
        break;

      case 'select':
        if (!param1) {
          console.log('❌ Укажите название модели');
          console.log('Пример: node db-manager.js select collection');
          return;
        }
        const records = await manager.getRecords(param1);
        console.log('📋 Результат:');
        console.table(records);
        break;

      case 'count':
        if (!param1) {
          console.log('❌ Укажите название модели');
          console.log('Пример: node db-manager.js count collection');
          return;
        }
        await manager.countRecords(param1);
        break;

      case 'add':
        if (!param1 || !param2) {
          console.log('❌ Укажите модель и данные в JSON формате');
          console.log('Пример: node db-manager.js add collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\'');
          return;
        }
        try {
          const data = JSON.parse(param2);
          await manager.addRecord(param1, data);
        } catch (error) {
          console.log('❌ Ошибка парсинга JSON данных');
        }
        break;

      case 'delete':
        if (!param1 || !param2) {
          console.log('❌ Укажите модель и условие удаления в JSON формате');
          console.log('Пример: node db-manager.js delete collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\'');
          return;
        }
        try {
          const where = JSON.parse(param2);
          await manager.removeRecord(param1, where);
        } catch (error) {
          console.log('❌ Ошибка парсинга JSON данных');
        }
        break;

      case 'update':
        if (!param1 || !param2 || !param3) {
          console.log('❌ Укажите модель, условие и данные для обновления в JSON формате');
          console.log('Пример: node db-manager.js update collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\' \'{"updatedAt":"2024-01-01"}\'');
          return;
        }
        try {
          const where = JSON.parse(param2);
          const data = JSON.parse(param3);
          await manager.updateRecord(param1, where, data);
        } catch (error) {
          console.log('❌ Ошибка парсинга JSON данных');
        }
        break;

      case 'find':
        if (!param1 || !param2) {
          console.log('❌ Укажите модель и условие поиска в JSON формате');
          console.log('Пример: node db-manager.js find collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\'');
          return;
        }
        try {
          const where = JSON.parse(param2);
          const record = await manager.getRecord(param1, where);
          if (record) {
            console.log('📋 Найденная запись:');
            console.table([record]);
          } else {
            console.log('❌ Запись не найдена');
          }
        } catch (error) {
          console.log('❌ Ошибка парсинга JSON данных');
        }
        break;

      case 'clear':
        if (!param1) {
          console.log('❌ Укажите название модели для очистки');
          console.log('Пример: node db-manager.js clear collection');
          return;
        }
        await manager.clearModel(param1);
        break;

      default:
        console.log('🔧 Универсальный менеджер базы данных с Prisma');
        console.log('');
        console.log('📋 Универсальные команды:');
        console.log('  models                    - Показать информацию о всех моделях');
        console.log('  select <model>            - Показать все записи из модели');
        console.log('  count <model>             - Подсчитать записи в модели');
        console.log('  add <model> <json>        - Добавить запись в модель');
        console.log('  delete <model> <json>     - Удалить записи по условию');
        console.log('  update <model> <where> <data> - Обновить записи');
        console.log('  find <model> <json>       - Найти одну запись по условию');
        console.log('  clear <model>             - Очистить все записи из модели');
        console.log('');
        console.log('💡 Примеры:');
        console.log('  node db-manager.js models');
        console.log('  node db-manager.js select collection');
        console.log('  node db-manager.js count collection');
        console.log('  node db-manager.js add collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\'');
        console.log('  node db-manager.js delete collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\'');
        console.log('  node db-manager.js find collection \'{"collectionId":"1501b9b9-83e0-4d05-a3af-d0e2021c6d5e"}\'');
        console.log('  node db-manager.js clear collection');
        break;
    }
  } catch (error) {
    console.error('❌ Ошибка выполнения команды:', error.message);
  } finally {
    await manager.close();
  }
};

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  runCommand();
}

module.exports = DatabaseManager;