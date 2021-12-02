
const { PLOTLY_USERNAME, PLOTLY_API_KEY } = require('./env')
const  plotly = require('plotly')({
  username: PLOTLY_USERNAME,
  apiKey: PLOTLY_API_KEY,
  host: 'chart-studio.plotly.com'
})
const { createWriteStream } = require('fs')
const options = { format: 'png', width: 1000, height: 500 }
const figureOptions = {
  xaxis: { title: 'Score', range: [10, 100], nticks: 10, ticksuffix: '%', zeroline: false },
  yaxis: { title: 'Frequency' }
}
const colour = {
  TV: '#063951',
  Manga: '#063951',
  Movies: '#0D95BC',
  Novels: '#0D95BC',
  ONAs: '#A2B969',
  OELs: '#A2B969',
  OVAs: '#EBCB38',
  Manhwa: '#EBCB38',
  Specials: '#F26F13',
  Manhua: '#F26F13',
  Music: '#C13018',
  Doujins: '#C13018',
  Oneshots: '#e377c3'
}
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
  anime: { TV: [], Movies: [], ONAs: [], OVAs: [], Specials: [], Music: [] },
  manga: { Manga: [], Manhua: [], Manhwa: [], Novels: [], OELs: [], Doujins: [], Oneshots: [] }
}
const average =  {
  anime: { TV: [], Movies: [], ONAs: [], OVAs: [], Specials: [], Music: [] },
  manga: { Manga: [], Manhua: [], Manhwa: [], Novels: [], OELs: [], Doujins: [], Oneshots: [] }
}

const replace = str => str.replace(/movie|ONA|OVA|special|music|manga|novel|oneshot|oel|manhua|manhwa|doujin/gi, matched => titles[matched])

function generateImage ({ figure, type, mediaType, subtype }) {
  plotly.getImage(figure, options, (err, imageStream) => {
    if (err) throw err
    const fileStream = createWriteStream(`images/${ mediaType ? mediaType + '_' : ''}${type}${subtype ? `_${subtype}` : ``}.png`)
    imageStream.pipe(fileStream)
  })
}

function generateGraphs (object, type, mediaType, layout = {}) {
  const traces = []

  for (let subtype in object) {
    const trace = {
      x: object[subtype],
      name: subtype,
      type: 'histogram',
      histnorm: '',
      xbins: {
        start: 10,
        end: 100,
        size: .4
      },
      nbinsx: 1000,
      marker: {
        color: colour[subtype]
      }
    }

    const figure = {
      data: [trace],
      layout: Object.assign(figureOptions, layout, {
        title: layout.title.replace(/\bscore\b/g, `score - ${subtype}`)
      })
    }

    generateImage({ figure, type, mediaType, subtype })
    traces.push(trace)
  }

  const figureCombined = {
    data: traces,
    layout: Object.assign(figureOptions, { barmode: 'stack' }, layout)
  }
  generateImage({ figure: figureCombined, type, mediaType })
}

['anime', 'manga'].forEach(type => {
  const dataFrequency = require(`./dataFrequency-${type}.json`)
  const dataAverage = require(`./dataAverage-${type}.json`)

  dataFrequency.forEach(({ score, subtype }) => {
    frequency[type][replace(subtype)].push(score)
  })

  dataAverage.forEach(({ score, subtype }) => {
    average[type][replace(subtype)].push(score)
  })

  generateGraphs(frequency[type], 'Frequency', type, {
    title: `Kitsu ${type} by score (raw rating frequencies)`
  })

  generateGraphs(average[type], 'Average', type, {
    title: `Kitsu ${type} by score`
  })
})
