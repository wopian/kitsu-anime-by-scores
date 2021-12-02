const { mean, median, variance, stdev, percentile, histogram } = require('stats-lite')
const table = require('markdown-table')
const titles = {
  movie: 'Movies',
  ONA: 'ONAs',
  OVA: 'OVAs',
  special: 'Specials',
  music: 'Music',
  manga: 'Manga',
  novel: 'Novels',
  oneshot: 'Oneshots',
  oel: 'OELs',
  manhua: 'Manhua',
  manhwa: 'Manhwa',
  doujin: 'Doujins'
}
const frequency = {
  anime: { All: [], TV: [], Movies: [], ONAs: [], OVAs: [], Specials: [], Music: [] },
  manga: { All: [], Manga: [], Manhua: [], Manhwa: [], Novels: [], OELs: [], Doujins: [], Oneshots: [] }
}
const average =  {
  anime: { All: [], TV: [], Movies: [], ONAs: [], OVAs: [], Specials: [], Music: [] },
  manga: { All: [], Manga: [], Manhua: [], Manhwa: [], Novels: [], OELs: [], Doujins: [], Oneshots: [] }
}
const unrated = {
  anime: {
    frequency: { All: 0, TV: 0, Movies: 0, ONAs: 0, OVAs: 0, Specials: 0, Music: 0 },
    average: { All: 0, TV: 0, Movies: 0, ONAs: 0, OVAs: 0, Specials: 0, Music: 0 }
  },
  manga: {
    frequency: { All: 0, Manga: 0, Novels: 0, Oneshots: 0, OELs: 0, Manhua: 0, Manhwa: 0, Doujins: 0 },
    average: { All: 0, Manga: 0, Novels: 0, Oneshots: 0, OELs: 0, Manhua: 0, Manhwa: 0, Doujins: 0 }
  }
}
const replace = str => str.replace(/movie|ONA|OVA|special|music|manga|novel|oneshot|oel|manhua|manhwa|doujin/gi, matched => titles[matched])

function printStats (data, unratedcount) {
  const header = ['']
  const stats = {
    Rated: {},
    Unrated: {},
    Average: {},
    Median: {},
    Variance: {},
    STDEV: {},
    '10%': {},
    '20%': {},
    '30%': {},
    '40%': {},
    '50%': {},
    '60%': {},
    '70%': {},
    '80%': {},
    '90%': {}
  }

  for (let subtype in data) {
    const set = data[subtype]

    header.push(subtype)

    stats.Rated[subtype] = set.length - unratedcount[subtype]
    stats.Unrated[subtype] = unratedcount[subtype]
    stats.Average[subtype] = (mean(set)/10).toFixed(2)
    stats.Median[subtype] = (median(set)/10).toFixed(2)
    stats.Variance[subtype] = (variance(set)/100).toFixed(2)
    stats.STDEV[subtype] = (stdev(set)/10).toFixed(2)
    stats['10%'][subtype] = (percentile(set, .1)/10).toFixed(2)
    stats['20%'][subtype] = (percentile(set, .2)/10).toFixed(2)
    stats['30%'][subtype] = (percentile(set, .3)/10).toFixed(2)
    stats['40%'][subtype] = (percentile(set, .4)/10).toFixed(2)
    stats['50%'][subtype] = (percentile(set, .5)/10).toFixed(2)
    stats['60%'][subtype] = (percentile(set, .6)/10).toFixed(2)
    stats['70%'][subtype] = (percentile(set, .7)/10).toFixed(2)
    stats['80%'][subtype] = (percentile(set, .8)/10).toFixed(2)
    stats['90%'][subtype] = (percentile(set, .9)/10).toFixed(2)
  }

  const rows = [header]

  Object.keys(stats).forEach(statistic => {
    const row = [statistic]
    // console.log(stats[statistic])
    Object.keys(stats[statistic]).forEach(subtype => {
      if (subtype === 'All') {
        row.push(`**${stats[statistic][subtype]}**`)
      } else {
        row.push(stats[statistic][subtype])
      }
    })
    rows.push(row)
  })

  const render = table(rows, {
    align: 'r'
  })
  console.log(render)
}

['anime', 'manga'].forEach(type => {
  const dataFrequency = require(`./dataFrequency-${type}.json`)
  const dataAverage = require(`./dataAverage-${type}.json`)

  dataFrequency.forEach(({ score, subtype }) => {
    frequency[type][replace(subtype)].push(score)
    if (score === '0.00') {
      unrated[type].frequency[replace(subtype)]++
      unrated[type].frequency.All++
    }
    frequency[type].All.push(score)
  })

  dataAverage.forEach(({ score, subtype }) => {
    average[type][replace(subtype)].push(score)
    if (score === null) {
      unrated[type].average[replace(subtype)]++
      unrated[type].average.All++
    }
    average[type].All.push(score)
  })

  printStats(average[type], unrated[type].average)
  printStats(frequency[type], unrated[type].frequency)
})
