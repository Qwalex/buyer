const fs = require('fs');
const path = require('path');
const getToken = require('./getToken');

const getCollections = async () => {
  const collectionsFilePath = path.join(__dirname, '..', 'collections.json');
  
  // Проверяем существование файла и его актуальность
  try {
    if (fs.existsSync(collectionsFilePath)) {
      const stats = fs.statSync(collectionsFilePath);
      const fileAge = Date.now() - stats.mtime.getTime();
      const oneMinute = 60 * 1000; // 1 минута в миллисекундах
      
      if (fileAge < oneMinute) {
        console.log('Используем кэшированные данные из collections.json');
        const cachedData = fs.readFileSync(collectionsFilePath, 'utf8');
        return JSON.parse(cachedData);
      }
    }
  } catch (error) {
    console.log('Ошибка при чтении кэшированного файла:', error.message);
  }

  // Если кэш неактуален или отсутствует, делаем запрос
  console.log('Запрашиваем новые данные...');
  
  const auth_token = await getToken();
  const myHeaders = new Headers();
  myHeaders.append("sec-ch-ua-platform", "\"Windows\"");
  myHeaders.append("Authorization", auth_token);
  myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36");
  myHeaders.append("Accept", "application/json, text/plain, */*");
  myHeaders.append("sec-ch-ua", "\"Not;A=Brand\";v=\"99\", \"Google Chrome\";v=\"139\", \"Chromium\";v=\"139\"");
  myHeaders.append("sec-ch-ua-mobile", "?0");
  myHeaders.append("Sec-Fetch-Site", "same-origin");
  myHeaders.append("Sec-Fetch-Mode", "cors");
  myHeaders.append("Sec-Fetch-Dest", "empty");
  myHeaders.append("Sec-Fetch-Storage-Access", "active");
  myHeaders.append("host", "portals-market.com");

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  };

  // Функция для выполнения запроса с повторными попытками
  const makeRequestWithRetries = async (maxRetries = 10, delay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Попытка ${attempt} из ${maxRetries}...`);
        const response = await fetch("https://portals-market.com/api/collections?limit=200", requestOptions);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Сохраняем данные в файл
        try {
          fs.writeFileSync(collectionsFilePath, JSON.stringify(data, null, 2));
          console.log('Данные успешно сохранены в collections.json');
        } catch (writeError) {
          console.log('Ошибка при сохранении данных в файл:', writeError.message);
        }
        
        return data;
      } catch (error) {
        console.log(`Попытка ${attempt} неудачна:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Все ${maxRetries} попыток запроса завершились неудачей. Последняя ошибка: ${error.message}`);
        }
        
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  return await makeRequestWithRetries();
}

module.exports = getCollections