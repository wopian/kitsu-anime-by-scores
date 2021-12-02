const Kitsu = require('kitsu')
const { writeFile } = require('fs')
const mean = require('weighted-mean')
const { KITSU_AUTH_TOKEN } = require('./env')
const api = new Kitsu({
  headers: {
    Authorization: `Bearer ${KITSU_AUTH_TOKEN}`
  }
})

const dataFrequency = { anime: [], manga: [] }
const dataAverage = { anime: [], manga: [] }
const log = { anime: '', manga: '' }

function logProgress (percent, remaining, type){
  log[type] =`${percent.toFixed(2)}% Complete. ${remaining} pages remaining`
  process.stdout.write(`Anime: ${log.anime} - Manga: ${log.manga}\r`)
}

async function getData (offset, type) {
  try {
    const { data, links, meta } = await api.get(type, {
      page: { limit: 20, offset },
      fields: { [type]: 'ratingFrequencies,averageRating,subtype' }
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

async function populate (offset, type) {
  const { data, links, count } = await getData(offset, type)
  for ({ ratingFrequencies, averageRating, subtype } of await data) {
    dataFrequency[type].push({ score: getScore(ratingFrequencies), subtype })
    dataAverage[type].push({ score: averageRating, subtype})
  }
  const percentComplete = ((offset + 20) / count * 100)
  const remaining = Math.ceil(((count - offset - 20) / 20))
  logProgress(percentComplete, remaining, type)
  if (links && links.next) await populate(offset + 20, type)
}

(async () => {
  ['anime', 'manga'].forEach(async type => {
    await populate(0, type)
    writeFile(`dataFrequency-${type}.json`, JSON.stringify(dataFrequency[type]), err => {
      if (err) throw err
      else console.log('Saved data to file')
    })

    writeFile(`dataAverage-${type}.json`, JSON.stringify(dataAverage[type]), err => {
      if (err) throw err
      else console.log('Saved data to file')
    })
  })
})()
