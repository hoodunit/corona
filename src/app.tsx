import { array, option, ord } from "fp-ts"
import { ordNumber } from "fp-ts/es6/Ord"
import * as NonEmptyArray from "fp-ts/lib/NonEmptyArray"
import { pipe } from "fp-ts/lib/pipeable"
import * as React from "react"
import * as ReactDOM from "react-dom"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"
import { CoronaData, DateEntry, getData } from "./data"

type AppProps = {
  data?: CoronaData
}

const App: React.FC<AppProps> = (props) => {
  if (!props.data) {
    return <div>Loading</div>
  }
  return (<div>
    <div className="title">Covid-19 Deaths</div>
    <div className="subtitle">Cumulative number of deaths, by number of days since 2nd death</div>
    <div className="chart-wrapper">
      <LogChart
        data={props.data}
        minDeaths={2}
      />
    </div>
  </div>)
}

type LogChartProps = {
  data: CoronaData
  minDeaths: number
}

const LogChart: React.FC<LogChartProps> = (props) => {
  const chartData = toChartData(props.data, props.minDeaths)
  return (
    <LineChart
      width={1000}
      height={600}
      data={chartData}
      margin={{
        top: 5, right: 30, left: 20, bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        dataKey="day"
        domain={["auto", "dataMax"]}
      />
      <YAxis
        domain={["auto", "auto"]}
        scale="log"
      />
      <Tooltip />
      <Legend
      />
      {CountryLine({
        dataKey: "Finland.deaths",
        stroke: "#51C9F6"
      })
      }
      {CountryLine({
        dataKey: "Italy.deaths",
        stroke: "#C98A25"
      })
      }
      { CountryLine({
        dataKey: "US.deaths",
        stroke: "#FFC5CB"
      })
      }
    </LineChart>
  )
}

type CountryLineProps = {
  dataKey: string
  stroke: string
}

const CountryLine: React.FC<CountryLineProps> = (props) => {
  return <Line
    type="monotone"
    dataKey={props.dataKey}
    stroke={props.stroke}
    strokeWidth={3}
    activeDot={{ r: 8 }}
  />
}

type ChartElem = {
  day: number
  Finland?: DateEntry
  Italy?: DateEntry
  US?: DateEntry
}

const toChartData = (data: CoronaData, minDeaths: number): Array<ChartElem> => {
  const drop = dropBelow(minDeaths)
  const cleanedData = {
    Finland: drop(data.Finland),
    Italy: drop(data.Italy),
    US: drop(data.US),
  }
  const zipped = zipCountries(cleanedData)
  return zipped
}

function zipWithNulls<T,U>(arr1: Array<T>, arr2: Array<U>): Array<[T | undefined, U | undefined]> {
  if (arr1.length > arr2.length) {
    return arr1.map((val, index) => {
      return [val, arr2[index]]
    })
  } else {
    return arr2.map((val, index) => {
      return [arr1[index], val]
    })
  }
}

const zipCountries = (data: CoronaData): Array<ChartElem> => {
  const zipped = zipWithNulls(zipWithNulls(data.Finland, data.US), data.Italy)
  const toEntry = (index: number, vals: [[DateEntry?, DateEntry?]?, DateEntry?]) => {
    const Finland = vals[0] && vals[0][0] ? vals[0][0] : undefined
    const US = vals[0] && vals[0][1] ? vals[0][1] : undefined
    const Italy = vals[1] ? vals[1] : undefined
    return {
      day: index,
      Finland: Finland,
      Italy: Italy,
      US: US
    } as ChartElem
  }
  return array.mapWithIndex(toEntry)(zipped)
}

const dropBelow = (min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const deathsGreater = (d: DateEntry) => d.deaths !== null && (d.deaths > min)
  return array.filter(deathsGreater)(arr)
}

const yAxisScale = (arr: Array<DateEntry>): Array<number> => {
  return pipe(arr, maxVal, scaleToMax)
}

const scaleToMax = (max: number): Array<number> => {
  const roundedMax = roundUp(max)
  return pipe(
    array.range(0, 10),
    array.map(v => v * roundedMax)
  )
}

const maxVal = (arr: Array<DateEntry>): number => {
  const vals = array.map((d: DateEntry) => d.deaths || 0)(arr)
  const nonEmptyVals = NonEmptyArray.fromArray(vals)
  const getMax = NonEmptyArray.max(ordNumber)
  return pipe(
    nonEmptyVals,
    option.map(getMax),
    option.getOrElse(() => 0)
  )
}

const roundUp = (val: number) => {
  const digits = (val + "").length
  const decade = Math.pow(10, digits - 1)
  return Math.ceil(val / decade) * decade
}

const roundUp2 = (val: number) => {
  if (val < 100) {
    return 100
  }
  if (val < 1000) {
    return 1000
  }
  if (val < 10000) {
    return 10000
  }
  if (val < 100000) {
    return 100000
  }
  if (val < 1000000) {
    return 1000000
  }
  if (val < 10000000) {
    return 10000000
  }
  if (val < 100000000) {
    return 100000000
  }
  return val
}

// const toLogScale = (arr: Array<DateEntry>): Array<DateEntry> => {
//
// }

const startApp = () => {
  const appElem = document.getElementById("app")
  ReactDOM.render(<App />, appElem)
  getData()
    .then(data => {
      ReactDOM.render(<App data={data} />, appElem)
    })
}

startApp();
