import { array, option, record } from "fp-ts"
import { ordNumber } from "fp-ts/es6/Ord"
import * as NonEmptyArray from "fp-ts/lib/NonEmptyArray"
import { pipe } from "fp-ts/lib/pipeable"
import { useState } from "react"
import * as React from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, ScaleType, Tooltip, XAxis, YAxis } from "recharts"
import { CoronaData, DateEntry } from "./data"
import { hashCode } from "./hash"
import * as DateFns from "date-fns/fp"

const colors = ["black", "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#b15928", "gray"]

const placeColors = {
  US: colors[0],
  "United Kingdom": colors[1],
  Italy: colors[2],
  Spain: colors[3],
  Finland: colors[4],
  Sweden: colors[5],
  "US-Arizona": colors[6],
  "US-Minnesota": colors[7],
  "US-Washington": colors[8],
  "US-New York": colors[9],
  "US-Minnesota-Hennepin": colors[10],
  "US-Arizona-Coconino": colors[11],
  "US-Washington-Clark": colors[12],
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
    <div className="log-chart-wrapper">
      <ScaleToggle
        onToggle={setScale}
        selected={scale}
      />
      <ResponsiveContainer width="100%" height={600}>
        <LineChart
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
            scale={lineScale(scale)}
          />
          <Tooltip
            formatter={(value: any, name: any, props: any) => {
              const date = props.payload[name].date
              const fmt = DateFns.format("MMM d")
              return [`${value} (${fmt(date)})`, name]
            }}
          />
          <Legend
          />
          { props.selected.map(key => CountryLine({
            key,
            metric: props.metric,
            stroke: placeColors[key] ?? colors[hashCode(key) % colors.length]
          }))}
          }
        </LineChart>
      </ResponsiveContainer>
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

const lineScale = (scale: Scale): ScaleType => {
  switch(scale) {
    case "linear": return "linear"
    case "log": return "log"
  }
}

type CountryLineProps = {
  key: string
  metric: string
  stroke: string
}

const CountryLine: React.FC<CountryLineProps> = (props) => {
  return <Line
    key={props.key}
    type="linear"
    dataKey={`${props.key}.${props.metric}`}
    name={props.key}
    stroke={props.stroke}
    strokeWidth={2}
    activeDot={{ r: 6 }}
    connectNulls
  />
}

type ChartElem = {}

const toChartData = (data: CoronaData, selected: Array<string>, metric: string, minMetric: number): Array<ChartElem> => {
  const cleaned: CoronaData = record.map(dropWhileBelowMetric(metric, minMetric))(data)
  const zeroMetricToNull = (d: DateEntry) => ({...d, [metric]: d[metric] === 0 ? null : d[metric]})
  const zeroToNull = record.map(array.map(zeroMetricToNull))
  const zeroed = zeroToNull(cleaned)
  const zipped = zipDays(zeroed, selected)
  return zipped
}

const zipDays = (data: CoronaData, selected: Array<string>): Array<ChartElem> => {
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

const dropWhileBelowMetric = (metric: string, min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const isBelowMetric = (d: DateEntry) => d[metric] !== null && (d[metric] < min)
  return array.dropLeftWhile(isBelowMetric)(arr)
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
