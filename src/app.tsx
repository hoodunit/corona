import { array } from "fp-ts"
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
  const chartData = toChartData(props.data)
  return (
    <LineChart
      width={1800}
      height={800}
      data={chartData}
      margin={{
        top: 5, right: 30, left: 20, bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="Finland.deaths" stroke="#8884d8" activeDot={{ r: 8 }} />
      <Line type="monotone" dataKey="Italy.deaths" stroke="#82ca9d" />
      <Line type="monotone" dataKey="US.deaths" stroke="#82ca9d" />
    </LineChart>
  )
}

type ChartElem = {
  date: Date
  Finland: DateEntry
  Italy: DateEntry
  US: DateEntry
}

const toChartData = (data: CoronaData): Array<ChartElem> => {
  const zipped = array.zip(array.zip(data.Finland, data.US), data.Italy)
  return array.map(([[Finland, US], Italy]: any) => {
    return {
      date: Finland.date,
      Finland,
      Italy,
      US
    }
  })(zipped)
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
