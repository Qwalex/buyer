const getToken = async () => {
  const response = await fetch(`https://dev.qwalex.ru/gift-api/api/getPortalsKey?password=${process.env.PORTALS_KEY_PASSWORD}`)
  const { data } = await response.json()

  return `tma ${data}`
}

module.exports = getToken