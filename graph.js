
const { PLOTLY_USERNAME, PLOTLY_API_KEY } = require('./env')
const  plotly = require('plotly')({
  username: PLOTLY_USERNAME,
  apiKey: PLOTLY_API_KEY,
  host: 'chart-studio.plotly.com'
})
const { createWriteStream } = require('fs')
const dataFrequency = require('./dataFrequency.json')
const dataAverage = require('./dataAverage.json')
const options = { format: 'png', width: 1000, height: 500 }
const figureOptions = {
  xaxis: { title: 'Score', range: [10, 100], nticks: 10, ticksuffix: '%', zeroline: false },
  yaxis: { title: 'Frequency' }
}
const titles = { movie: 'Movies', ONA: 'ONAs', OVA: 'OVAs', special: 'Specials', music: 'Music' }
const frequency = { TV: [], Movies: [], ONAs: [], OVAs: [], Specials: [], Music: [] }
const average = { TV: [], Movies: [], ONAs: [], OVAs: [], Specials: [], Music: [] }
const colour = {
  TV: '#063951',
  Movies: '#0D95BC',
  ONAs: '#A2B969',
  OVAs: '#EBCB38',
  Specials: '#F26F13',
  Music: '#C13018'
}
const replace = str => str.replace(/movie|ONA|OVA|special|music/gi, matched => titles[matched])

dataFrequency.forEach(({ score, subtype }) => {
  frequency[replace(subtype)].push(score)
})

dataAverage.forEach(({ score, subtype }) => {
  average[replace(subtype)].push(score)
})

function generateImage ({ figure, type, subtype }) {
  plotly.getImage(figure, options, (err, imageStream) => {
    if (err) throw err
    const fileStream = createWriteStream(`images/${type}${subtype ? `_${subtype}` : ``}.png`)
    imageStream.pipe(fileStream)
    //fileStream.pipe(imageStream)
  })
}


function generateGraphs (object, type, layout = {}) {
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

    generateImage({ figure, type, subtype })
    traces.push(trace)
  }

  const figureCombined = {
    data: traces,
    layout: Object.assign(figureOptions, { barmode: 'stack' }, layout)
  }
  generateImage({ figure: figureCombined, type })
}

generateGraphs(frequency, 'Frequency', {
  title: 'Kitsu anime by score (raw rating frequencies)'
})

generateGraphs(average, 'Average', {
  title: 'Kitsu anime by score'
})
