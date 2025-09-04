const sendNotification = async ({ text }) => {
  console.log('Отправка уведомления')
  await fetch('https://dev.qwalex.ru/notify/?text=' + encodeURIComponent(text))
}

module.exports = sendNotification