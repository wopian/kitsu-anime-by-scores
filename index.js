const Kitsu = require('kitsu')
const { writeFile } = require('fs')
const mean = require('weighted-mean')
const { KITSU_AUTH_TOKEN } = require('./env')
const api = new Kitsu({
  headers: {
    Authorization: `Bearer ${KITSU_AUTH_TOKEN}`
  }
})

const dataFrequency = []
const dataAverage = []

async function getData (offset) {
  try {
    const { data, links, meta } = await api.get('anime', {
      page: { limit: 20, offset },
      fields: { anime: 'ratingFrequencies,averageRating,subtype' }
    })
    return { data, links, count: meta.count }
  } catch (e) {
    console.error(e)
  }
}

function getScore (ratingFrequencies) {
  try {
    const ratings = Object.keys(ratingFrequencies).map(key => [ key / 2, +ratingFrequencies[key] ])
    return (mean(ratings) * 10).toFixed(2) || null
  } catch (e) {
    console.error(e)
  }
}

async function populate (offset) {
  const { data, links, count } = await getData(offset)
  for ({ ratingFrequencies, averageRating, subtype } of await data) {
    dataFrequency.push({ score: getScore(ratingFrequencies), subtype })
    dataAverage.push({ score: averageRating, subtype})
  }
  const percentComplete = ((offset + 20) / count * 100)
  const remaining = Math.ceil(((count - offset - 20) / 20))
  process.stdout.write(`${percentComplete.toFixed(2)}% Complete. ${remaining} pages remaining\r`)
  if (links && links.next) await populate(offset + 20)
}

(async () => {
  await populate(0)
  writeFile('dataFrequency.json', JSON.stringify(dataFrequency), err => {
    if (err) throw err
    else console.log('Saved data to file')
  })

  writeFile('dataAverage.json', JSON.stringify(dataAverage), err => {
    if (err) throw err
    else console.log('Saved data to file')
  })
})()
