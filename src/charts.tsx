import { array, option, record } from "fp-ts"
import { ordNumber } from "fp-ts/es6/Ord"
import * as NonEmptyArray from "fp-ts/lib/NonEmptyArray"
import { pipe } from "fp-ts/lib/pipeable"
import { useState } from "react"
import * as React from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  ScaleType,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { ChartStar } from "./ChartStar"
import { CoronaData, DateEntry } from "./data"
import { hashCode } from "./hash"
import * as DateFns from "date-fns/fp"
import { Scale, ScaleToggle } from "./ScaleToggle"

const colors = [
  "black",
  "#a6cee3",
  "#1f78b4",
  "#b2df8a",
  "#33a02c",
  "#fb9a99",
  "#e31a1c",
  "#571845",
  "#fdbf6f",
  "#ff7f00",
  "#cab2d6",
  "#6a3d9a",
  "#E837B5",
  "#b15928",
  "#444444"]

const parseDate = DateFns.parse(new Date())("yyyy-MM-dd")

const lockdownDates = {
  "United Kingdom": parseDate("2020-03-24"), // Nation-wide quarantine
  Italy: parseDate("2020-03-09"), // Nation-wide quarantine
  Spain: parseDate("2020-03-14"), // Nation-wide quarantine
  Finland: parseDate("2020-03-18"), // Partial nation-wide quarantine, schools closed
  France: parseDate("2020-03-16"), // Nation-wide quarantine
  "US-Florida": parseDate("2020-04-01"), // State-wide quarantine
  "US-Minnesota": parseDate("2020-03-27"), // State-wide quarantine
  "US-New York": parseDate("2020-03-22"), // State-wide quarantine
  "US-Washington": parseDate("2020-03-23"), // State-wide quarantine
  "US-Arizona": parseDate("2020-03-31"), // State-wide quarantine
}

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
  metric: keyof DateEntry
}

export const LogChart: React.FC<LogChartProps> = (props) => {
  const chartData = toChartData(props.data, props.metric)
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
            itemSorter={(item, b) => {
              return -item.value as any
            }}
            labelFormatter={(v: any) => `Day ${v}`}
          />
          <Legend />
          { record.keys(props.data).map(key => {
            const hash = hashCode(key) % colors.length
            const color = placeColors[key] ?? colors[hash]
            return CountryLine({
                key,
                metric: props.metric,
                stroke: color
              })
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
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
  const lockdownDate = lockdownDates[props.key]
  return <Line
    key={props.key}
    type="linear"
    dataKey={`${props.key}.${props.metric}`}
    name={props.key}
    stroke={props.stroke}
    strokeWidth={2}
    dot={dotProps => <ChartStar {...dotProps} date={lockdownDate} placeKey={props.key} />}
    activeDot={{ r: 4, stroke: "black", strokeWidth: 1 }}
    connectNulls
  />
}

type ChartElem = {}

const toChartData = (data: CoronaData, metric: string): Array<ChartElem> => {
  const zeroMetricToNull = (d: DateEntry) => ({...d, [metric]: d[metric] === 0 ? null : d[metric]})
  const zeroToNull = record.map(array.map(zeroMetricToNull))
  const zeroed = zeroToNull(data)
  const zipped = zipDays(zeroed)
  return zipped
}

const zipDays = (data: CoronaData): Array<ChartElem> => {
  const selected = record.keys(data)
  const selectedData = record.collect((k: string, v: Array<DateEntry>) => v)(data)
  const lengths = array.map((d: Array<DateEntry>) => d.length)(selectedData)
  const max = maxInArr(lengths)
  return pipe(
    array.range(0, max),
    array.map(index => {
      const vals = {}
      selected.forEach(key => {
        if (!data[key]) {
          throw new Error(`Missing data for key '${key}'`)
        }
        vals[key] = data[key][index]
      })
      vals["day"] = index
      return vals
    })
  )
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
