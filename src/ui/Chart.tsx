import * as DateFns from "date-fns/fp"
import { array, option, record } from "fp-ts"
import { ordNumber } from "fp-ts/es6/Ord"
import * as NonEmptyArray from "fp-ts/lib/NonEmptyArray"
import { pipe } from "fp-ts/lib/pipeable"
import * as React from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, ScaleType, Tooltip, XAxis, YAxis } from "recharts"
import { CoronaData, DateEntry } from "../data"
import { dataDateRange, DateRange } from "../dataHelpers"
import { hashCode } from "../hash"
import { ChartStar } from "./ChartStar"
import { Scale, ScaleToggle } from "./ScaleToggle"
import { XAxisTypeToggle } from "./XAxisTypeToggle"

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

export type ChartProps = {
  data: CoronaData
  setScale: (scale: Scale) => void
  setXAxisType: (xAxisType: XAxisType) => void
  options: ChartOptions
}

export type ChartOptions = {
  metric: keyof DateEntry
  minMetric: number
  dataIsCumulative: boolean
  scale: Scale
  xAxisType: XAxisType
}

export type XAxisType = "relative" | "time-based"

export const Chart: React.FC<ChartProps> = (props) => {
  const chartData = toChartData(props.options, props.data)
  const dataKey = props.options.xAxisType === "relative" ? "day" : "date"
  return (
    <div className="chart">
      <div className="chart__toggles">
        <ScaleToggle
          onToggle={props.setScale}
          selected={props.options.scale}
        />
        <XAxisTypeToggle
          onToggle={props.setXAxisType}
          selected={props.options.xAxisType}
        />
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <LineChart
          data={chartData}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={dataKey}
            domain={["auto", "dataMax"]}
            tickFormatter={(value: any) => {
              switch (props.options.xAxisType) {
                case "relative": return value
                case "time-based": return monthAndDay(new Date(value))
              }
            }}
          />
          <YAxis
            domain={["auto", "auto"]}
            scale={lineScale(props.options.scale)}
          />
          <Tooltip
            formatter={(value: any, name: any, formatterProps: any) => {
              const date = formatterProps.payload[name].date
              if (props.options.xAxisType === "relative") {
                return [`${value} (${monthAndDay(date)})`, name]
              } else {
                return [`${value}`, name]
              }
            }}
            itemSorter={(item, b) => {
              return -item.value as any
            }}
            labelFormatter={(v: any) => {
              switch (props.options.xAxisType) {
                case "relative": return `Day ${v}`
                case "time-based": {
                  return monthAndDay(new Date(v))
                }
              }
            }}
          />
          <Legend />
          { record.keys(props.data).map(key => {
            const hash = hashCode(key) % colors.length
            const color = placeColors[key] ?? colors[hash]
            return CountryLine({
                key,
                metric: props.options.metric,
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

type ChartElem = {
  day?: number
  date?: number
}

const toChartData = (options: ChartOptions, data: CoronaData): Array<ChartElem> => {
  return pipe(
    data,
    dropBelowMetric(options),
    zerosToNull(options),
    zipToChartData(options)
  )
}

const dropBelowMetric = (options: ChartOptions): (data: CoronaData) => CoronaData => {
  if (options.xAxisType === "time-based"){
    return (a => a)
  }
  if (options.dataIsCumulative) {
    return record.map(dropWhileBelow(options.metric, options.minMetric))
  } else {
    return record.map(dropWhileBelowCumulative(options.metric, options.minMetric))
  }
}

const zerosToNull = (options: ChartOptions): (data: CoronaData) => CoronaData => {
  if (options.scale === "log") {
    return record.map(array.map(zeroMetricToNull(options.metric)))
  } else {
    return (a => a)
  }
}

const zeroMetricToNull = (metric: string) => (d: DateEntry) => {
  return {...d, [metric]: d[metric] === 0 ? null : d[metric]}
}

const zipToChartData = (options: ChartOptions): (data: CoronaData) => Array<ChartElem> => {
  switch (options.xAxisType) {
    case "relative": return zipDays
    case "time-based": return zipDates
  }
}

const zipDates = (data: CoronaData): Array<ChartElem> => {
  const dateRange = option.getOrElse<DateRange | undefined>(() => undefined)(dataDateRange(data))
  if (!dateRange) {
    return []
  }
  const dates = pipe(
    array.range(0, DateFns.differenceInDays(dateRange.start, dateRange.end)),
    array.map((day: number) => DateFns.addDays(day)(dateRange.start))
  )
  const keys = record.keys(data)
  return pipe(
    dates,
    array.map((date: Date) => {
      const vals = {}
      keys.forEach(key => {
        const dateData = pipe(
          data[key],
          array.findFirst((d: DateEntry) => DateFns.isEqual(d.date, date)),
          option.getOrElse<DateEntry | undefined>(() => undefined)
        )
        vals[key] = dateData
      })
      vals["date"] = date.getTime()
      return vals
    })
  )
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

const monthAndDay = (date: Date): string => {
  return DateFns.format("MMM d")(date)
}

const dropWhileBelow = (metric: string, min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const isBelowMetric = (d: DateEntry) => d[metric] !== null && (d[metric] < min)
  return array.dropLeftWhile(isBelowMetric)(arr)
}

type PartialSum = {
  entries: Array<DateEntry>
  sum: number
}

const dropWhileBelowCumulative = (metric: string, min: number) => (arr: Array<DateEntry>): Array<DateEntry> => {
  const drop = ({entries, sum}: PartialSum, next: DateEntry) => {
    const newSum = sum + (next[metric] || 0)
    if (newSum < min) {
      return {entries: [], sum: newSum}
    }
    return {entries: entries.concat(next), sum: newSum}
  }
  const {entries} = array.reduce({entries: [], sum: 0}, drop)(arr)
  return entries
}
