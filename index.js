const fs = require('fs');
const getToken = require('./libs/getToken.js');
const sendNotification = require('./libs/sendNotification.js');
const getCollections = require('./libs/getCollections.js');
const database = require('./database.js');
require('dotenv').config();

const user_id = process.env.USER_ID;
const controlMaxOfferPriceCollectionsIntervals = []
const INTERVAL_TIME = 10000
let previousMessage = null

// Инициализация базы данных
const initDatabase = async () => {
  try {
    await database.init();
    console.log('База данных инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
  }
}

// Получить ID коллекций из базы данных
const getCollectionIdsFromDB = async () => {
  try {
    const collectionIds = await database.getAllCollectionIds();
    console.log(`Получено ${collectionIds.length} ID коллекций из базы данных:`, collectionIds);
    return collectionIds;
  } catch (error) {
    console.error('Ошибка получения ID коллекций из базы:', error);
    return [];
  }
}

const portalsCheckOfferGetAll = async ({ collectionId }) => {
  const auth_token = await getToken()
  const response = await fetch(
    `https://portals-market.com/api/collection-offers/${collectionId}/all`,
    {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        authorization:
          auth_token,
      },
      referrer: 'https://portals-market.com/quick-sale-offers',
      body: null,
      method: 'GET',
    },
  );
  return await response.json();
};

const portalsCheckOfferPositionUpdatePrice = async ({ price, offerId }) => {
  const auth_token = await getToken()
  console.log('...in process portalsCheckOfferPositionUpdatePrice')
  const myHeaders = new Headers();
  myHeaders.append('host', 'portals-market.com');
  myHeaders.append('connection', 'keep-alive');
  // Убираем фиксированный content-length - Node.js установит его автоматически
  myHeaders.append('pragma', 'no-cache');
  myHeaders.append('cache-control', 'no-cache');
  myHeaders.append('sec-ch-ua-platform', '"Windows"');
  myHeaders.append(
    'authorization',
    auth_token,
  );
  myHeaders.append(
    'user-agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  );
  myHeaders.append('accept', 'application/json, text/plain, */*');
  myHeaders.append(
    'sec-ch-ua',
    '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
  );
  myHeaders.append('content-type', 'application/json');
  myHeaders.append('sec-ch-ua-mobile', '?0');
  myHeaders.append('origin', 'https://portals-market.com');
  myHeaders.append('sec-fetch-site', 'same-origin');
  myHeaders.append('sec-fetch-mode', 'cors');
  myHeaders.append('sec-fetch-dest', 'empty');
  myHeaders.append('sec-fetch-storage-access', 'active');
  myHeaders.append(
    'referer',
    'https://portals-market.com/my-offers?tab=collections',
  );
  myHeaders.append('accept-encoding', 'gzip, deflate, br, zstd');
  myHeaders.append('accept-language', 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7');
  myHeaders.append(
    'cookie',
    '_ym_uid=1753561375311827853; _ym_d=1755714487; _ym_isad=2; _ym_visorc=b',
  );

  const raw = JSON.stringify({
    amount: price,
    id: offerId,
    max_nfts: 1,
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  const response = await fetch(
    'https://portals-market.com/api/collection-offers/update',
    requestOptions,
  );
  
  // Проверяем статус ответа
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Проверяем, что в ответе есть контент
  const text = await response.text();
  if (!text) {
    console.log('Пустой ответ от сервера');
    return null;
  }
  
  try {
    const json = JSON.parse(text);
    return json;
  } catch (error) {
    console.log('Ошибка парсинга JSON:', error.message);
    console.log('Полученный текст:', text);
    return null;
  }
};

const createOffer = () => {
  console.log('...in process createOffer')
}

const isMyOffer = ({ sender_id }) => {
  return sender_id === +user_id
}

const saveMaxPrice = async ({ collectionId, includeCommision = false }) => {
  console.log('Запуск функции saveMaxPrice для коллекции ' + collectionId)
  const offers = await portalsCheckOfferGetAll({ collectionId })
  const myOffer = offers.find(isMyOffer)
  let prevOffer

  if (myOffer) {
    prevOffer = myOffer
  }

  if (!myOffer?.id) {
    console.log('В данной коллекции нет моего офера ' + collectionId)
    if (controlMaxOfferPriceCollectionsIntervals?.find(interval => interval.collectionId === collectionId)) {
      console.log('Очистка интервала для коллекции ' + collectionId)
      clearInterval(controlMaxOfferPriceCollectionsIntervals.find(interval => interval.collectionId === collectionId).interval)
    }

    if (prevOffer) {
      fs.writeFileSync(`last_offer_${Date.now()}.json`, JSON.stringify(prevOffer, null, 2))
      fetch('https://dev.qwalex.ru/notify/?text=prev_offer_saved')
    }

    return
  }

  const myOfferPrice = Number(myOffer.amount)
  const floorPrice = Number(offers[0].collection.floor_price)
  const availableMaxPrice = Number((floorPrice - (includeCommision ? floorPrice * 0.05 : 0) - 0.01).toFixed(2))
  const currentOffersMaxPrice = Math.max(...offers.filter(({ sender_id }) => sender_id !== +user_id).map(({ amount }) => Number(Number(amount).toFixed(2))))
  const needPrice = Number((currentOffersMaxPrice < availableMaxPrice ? currentOffersMaxPrice + 0.01 : availableMaxPrice).toFixed(2))
  const offerId = myOffer.id
  
  if (myOfferPrice !== needPrice) {
    console.log('Цена обновлена для коллекции ' + collectionId)
    console.log({
      myOfferPrice,
      floorPrice,
      availableMaxPrice,
      currentOffersMaxPrice,
      needPrice,
    })
    await portalsCheckOfferPositionUpdatePrice({ price: needPrice, offerId })
  } else {
    console.log('Цены актуальны для коллекции ' + collectionId)
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const getMyOffer = async ({ collectionId }) => {
  const offers = await portalsCheckOfferGetAll({ collectionId })
  return offers.find(isMyOffer)
}

const startCorrectMaxOfferPrice = async () => {
  let collectionIds;

  // Сначала пытаемся получить ID коллекций из базы данных
  collectionIds = await getCollectionIdsFromDB();
  console.log('collectionIds', collectionIds)
  
  if (collectionIds.length === 0) {
    console.log('В базе данных нет ID коллекций для обработки, получаем все из getCollections');
    const collections = await getCollections();
    collectionIds = collections.collections.map(({ id }) => id);
  }
  
  for (const collectionId of collectionIds) {
    await saveMaxPrice({ collectionId })
    await delay(1000)

    const existingInterval = controlMaxOfferPriceCollectionsIntervals.find(interval => interval.collectionId === collectionId);
    console.log(`Проверка интервала для коллекции ${collectionId}:`, existingInterval ? 'найден' : 'не найден');
    console.log('Текущие интервалы:', controlMaxOfferPriceCollectionsIntervals.map(i => i.collectionId));
    
    if (!existingInterval) {
      console.log('Создание интервала для коллекции ' + collectionId)
      const interval = setInterval(async () => {
        await saveMaxPrice({ collectionId })
        console.log('--------------------------------')
      }, INTERVAL_TIME)
  
      controlMaxOfferPriceCollectionsIntervals.push({
        collectionId,
        interval,
      })  
    } else {
      console.log('Интервал для коллекции ' + collectionId + ' уже существует, пропускаем')
    }
  }
}

/**
 * 
 * @param {*} func - функция для запуска
 * @param {*} interval - интервал в минутах
 */
const start = async (func, interval = 1) => {
  await func()
  await delay(1000)
  setInterval(async () => {
    await func()
    console.log('--------------------------------')
  }, interval * 1000 * 60)
}

/**
 * @param {number} needDiffPercent - минимальная разница в процентах между максимальной ценой офера и ценой флоора
 * @param {number} maxPrice - максимальная цена коллекции
 */
const searchDiscount = async ({ needDiffPercent, maxPrice }) => {
  if (!needDiffPercent || !maxPrice) {
    throw new Error('Не переданы параметры needDiffPercent или maxPrice')
  }
  
  const { collections } = await getCollections()
  const collectionIds = collections.map(({ id }) => id)
  
  for (const collectionId of collectionIds) {
    const offers = (await portalsCheckOfferGetAll({ collectionId })).filter(({ sender_id }) => sender_id !== +user_id)
    const maxOfferPrice = Math.max(...offers.map(({ amount }) => Number(amount)))
    const floorPrice = Number(offers[0].collection.floor_price)
    const diffPercent = Number((100 - (((maxOfferPrice + 0.01) / floorPrice) * 100)).toFixed(2))
    const maxComfortPrice = Number((floorPrice - (floorPrice * (needDiffPercent / 100))).toFixed(2))
    const myOffer = await getMyOffer({ collectionId })
    
    if (diffPercent > needDiffPercent && floorPrice <= maxPrice) {
      if (controlMaxOfferPriceCollectionsIntervals.find(interval => interval.collectionId === collectionId)) {
        console.log('Эта коллекция уже в процессе обработки на покупку')
        return 
      }
      
      console.group('Найдена большая разница в цене')
      console.log({
        collection: collections.find(({ id }) => id === collectionId).name,
        maxOfferPrice,
        floorPrice,
        diffPercent,
        maxComfortPrice,
      })
      console.groupEnd()

      // await sendNotification({ text: `В коллекции ${collections.find(({ id }) => id === collectionId).name} разница в цене ${diffPercent}%` })

      if (myOffer) {
        console.log('Обновление цены офера')
        await portalsCheckOfferPositionUpdatePrice({ price: maxOfferPrice + 0.01, offerId: myOffer.id })
      } else {
        console.log('Офер не найден')
        const text = `В коллекции ${collections.find(({ id }) => id === collectionId).name} разница в цене ${diffPercent}%`
        if (previousMessage !== text) {
          previousMessage = text
          await sendNotification({ text })
        }
      }
    } else {
      if (myOffer) {
        await portalsCheckOfferPositionUpdatePrice({ price: maxComfortPrice, offerId: myOffer.id })
        console.log('Цена офера обновлена на максимально комфортную')
      }
      console.group('Пропускаем коллекцию ' + collections.find(({ id }) => id === collectionId).name)
      console.log(JSON.stringify({ maxOfferPrice, floorPrice, diffPercent }))
      console.groupEnd()
    }

    await delay(1000)
  }
}

// -- start section
const main = async () => {
  // Инициализируем базу данных
  await initDatabase();
  
  // Запускаем обработку коллекций
  await start(() => startCorrectMaxOfferPrice(), 30) // интервал 1 минута
  await start(() => searchDiscount({ needDiffPercent: 10, maxPrice: 35 }), 30)
}

// Запускаем основную функцию
main().catch(console.error);

/** нужен кейс где идет покупка и запущен поиск дисконта */