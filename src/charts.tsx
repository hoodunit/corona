import { array, option, record } from "fp-ts"
import { ordNumber } from "fp-ts/es6/Ord"
import * as NonEmptyArray from "fp-ts/lib/NonEmptyArray"
import { pipe } from "fp-ts/lib/pipeable"
import { useState } from "react"
import * as React from "react"
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts"
import { CoronaData, DateEntry } from "./data"

const colors = {
  Finland: "#51C9F6",
  Italy: "#C98A25",
  US: "#FFC5CB",
  Sweden: "green",
  "US-Arizona": "orange",
  "US-Minnesota": "purple",
  "US-New York": "gray",
  "US-Minnesota-Hennepin": "red",
  "US-Arizona-Coconino": "pink",
  "US-Washington-Clark": "blue",
}

type LogChartProps = {
  data: CoronaData
  selected: Array<string>
  metric: keyof DateEntry
  minMetric: number
}

export const LogChart: React.FC<LogChartProps> = (props) => {
  const chartData = toChartData(props.data, props.selected, props.metric, props.minMetric)
  const [scale, setScale] = useState<Scale>("log")
  return (
    <div>
      <ScaleToggle
        onToggle={setScale}
        selected={scale}
      />
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
          scale={scale}
        />
        <Tooltip />
        <Legend
        />
        { props.selected.map(key => CountryLine({
          dataKey: `${key}.${props.metric}`,
          stroke: colors[key]
        }))}
        }
      </LineChart>
    </div>
  )
}

type ScaleToggleProps = {
  onToggle: (scale: Scale) => void
  selected: Scale
}

type Scale = "linear" | "log"

const ScaleToggle: React.FC<ScaleToggleProps> = (props) => {
  const otherScale: Scale = props.selected === "linear" ? "log" : "linear"
  return <div
    className="scale-toggle"
    onClick={() => props.onToggle(otherScale)}>{scaleTitle(props.selected)} </div>
}

const scaleTitle = (scale: Scale): string => {
  switch(scale) {
    case "linear": return "Linear"
    case "log": return "Logarithmic"
  }
}

type CountryLineProps = {
  dataKey: string
  stroke: string
}

const CountryLine: React.FC<CountryLineProps> = (props) => {
  return <Line
    key={props.dataKey}
    type="linear"
    dataKey={props.dataKey}
    stroke={props.stroke}
    strokeWidth={3}
    activeDot={{ r: 8 }}
  />
}

type ChartElem = {}

const toChartData = (data: CoronaData, selected: Array<string>, metric: string, minMetric: number): Array<ChartElem> => {
  const cleaned: CoronaData = record.map(dropBelow(metric, minMetric))(data)
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

const dropBelow = (metric: string, min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const isGreater = (d: DateEntry) => d[metric] !== null && (d[metric] > min)
  return array.filter(isGreater)(arr)
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
