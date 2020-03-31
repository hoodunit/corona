import { array, option, record } from "fp-ts"
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

const countries = [
  "Finland",
  "Italy",
  "US",
  "Sweden",
  "US-Arizona",
  "US-Minnesota",
  "US-New York",
  "US-Washington",
]
const colors = {
  Finland: "#51C9F6",
  Italy: "#C98A25",
  US: "#FFC5CB",
  Sweden: "green",
  "US-Arizona": "orange",
  "US-Minnesota": "purple",
  "US-New York": "gray",
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
        selected={countries}
      />
    </div>
  </div>)
}

type LogChartProps = {
  data: CoronaData
  minDeaths: number
  selected: Array<string>
}

const LogChart: React.FC<LogChartProps> = (props) => {
  const chartData = toChartData(props.data, props.selected, props.minDeaths)
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
      { countries.map(key => CountryLine({
        dataKey: `${key}.deaths`,
        stroke: colors[key]
      }))}
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
    key={props.dataKey}
    type="monotone"
    dataKey={props.dataKey}
    stroke={props.stroke}
    strokeWidth={3}
    activeDot={{ r: 8 }}
  />
}

type ChartElem = {}

const toChartData = (data: CoronaData, selected: Array<string>, minDeaths: number): Array<ChartElem> => {
  const cleaned: CoronaData = record.map(dropBelow(minDeaths))(data)
  const zipped = zipSelected(cleaned, selected)
  return zipped
}

const zipSelected = (data: CoronaData, selected: Array<string>): Array<ChartElem> => {
  const selectedData = array.map((s: string) => data[s] as Array<DateEntry>)(selected)
  const lengths = array.map((d: Array<DateEntry>) => d.length)(selectedData)
  const max = maxInArr(lengths)
  return pipe(
    array.range(0, max),
    array.map(index => {
      const vals = {}
      selected.forEach(key => {
        vals[key] = data[key][index]
      })
      vals["day"] = index
      return vals
    })
  )
}

const dropBelow = (min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const deathsGreater = (d: DateEntry) => d.deaths !== null && (d.deaths > min)
  return array.filter(deathsGreater)(arr)
}

const maxInArr = (vals: Array<number>): number => {
  const nonEmptyVals = NonEmptyArray.fromArray(vals)
  const getMax = NonEmptyArray.max(ordNumber)
  return pipe(
    nonEmptyVals,
    option.map(getMax),
    option.getOrElse(() => 0)
  )
}

const startApp = () => {
  const appElem = document.getElementById("app")
  ReactDOM.render(<App />, appElem)
  getData()
    .then(data => {
      ReactDOM.render(<App data={data} />, appElem)
    })
}

startApp();
