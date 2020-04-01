import { array, either, option, ord, record } from "fp-ts"
import { pipe } from "fp-ts/es6/pipeable"
import { ordNumber } from "fp-ts/lib/Ord"
import * as t from "io-ts"
import * as IoTsReporter from "io-ts-reporters"
import { DateFromString, NumberFromString } from "./codecs"
import Papa = require("papaparse")
import * as fetchPonyfill from "fetch-ponyfill"
import * as DateFns from "date-fns/fp"

const fetchPony = fetchPonyfill({}).fetch

const DateEntrySpec = t.exact(t.type({
  date: DateFromString,
  confirmed: t.union([t.number, t.null]),
  deaths: t.union([t.number, t.null]),
  recovered: t.union([t.number, t.null])
}))
export type DateEntry = t.TypeOf<typeof DateEntrySpec>

const CoronaDataSpec = t.record(t.string, t.array(DateEntrySpec))
export type CoronaData = t.TypeOf<typeof CoronaDataSpec>

const validateOrThrow = <I,A>(decoder: t.Decoder<I,A>) => (val: I): A => {
  const onError = (errors: t.Errors) => {
    throw new Error(formatErrors(errors))
  }
  const fold = either.fold(onError, decodedVal => decodedVal as any)
  const decoded = decoder.decode(val)
  return fold(decoded)
}

export function formatErrors(errors: Array<t.ValidationError>): string {
  return IoTsReporter.reporter(either.left(errors)).join('\n')
}

export const getData = async (): Promise<CoronaData> => {
  const countries = await getCountries()
  const states = await getStates()
  const counties = await getCounties()
  const fullData = {
    ...states,
    ...countries,
    ...counties
  }
  const sorted = record.map(sortByDate)(fullData)
  const filled = record.map(fillEmptyEntries)(sorted)
  validateEntries(filled)
  return filled
}

const sortByDate = (entries: Array<DateEntry>): Array<DateEntry> => {
  const byDate = pipe(
    ordNumber,
    ord.contramap((d: DateEntry) => d.date.getTime())
  )
  return array.sort(byDate)(entries)
}

const fillEmptyEntries = (entries: Array<DateEntry>): Array<DateEntry> => {
  const fillEntries = array.reduce([], (cur: Array<DateEntry>, next: DateEntry) => {
    const prev = cur[cur.length - 1]
    if (!prev) {
      return array.snoc(cur, next)
    }
    const dayDiff = DateFns.differenceInDays(prev.date, next.date)
    if (dayDiff <= 1) {
      return array.snoc(cur, next)
    }
    const missing: Array<DateEntry> = pipe(
      array.range(1, dayDiff - 1),
      array.map(days => {
        return {
          date: DateFns.addDays(days)(prev.date),
          confirmed: prev.confirmed,
          deaths: prev.deaths,
          recovered: prev.recovered
        }
      })
    )
    return cur.concat(missing)
  })
  return fillEntries(entries)
}

const validateEntries = (data: CoronaData) => {
  record.mapWithIndex(validateEntry)(data)
}

const validateEntry = (key: string, vals: Array<DateEntry>): void => {
  let prev: DateEntry | undefined = undefined
  vals.forEach((next, index) => {
    if (prev && DateFns.isAfter(next.date, prev.date)) {
      throw new Error(`At ${key}[${index}]: expected ${prev.date} to be before ${next.date}`)
    }
    if (prev && DateFns.differenceInDays(prev.date, next.date) > 1) {
      throw new Error(`At ${key}[${index}]: expected ${prev.date} to be within one day of ${next.date}`)
    }
    prev = next
  })
}

const getCountries = (): Promise<CoronaData> => {
  return fetchPony("https://pomber.github.io/covid19/timeseries.json")
    .then(response => response.json())
    .then(data => {
      return validateOrThrow(CoronaDataSpec)(data)
    })
}

export const getStates = (): Promise<any> => {
  return fetchPony("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv")
    .then(response => response.text())
    .then(parseStates)
}

const parseStates = (csv: string): CoronaData => {
  const parsed = Papa.parse(csv).data
  const rows = array.dropLeft(1)(parsed)
  const result = {}
  const parseDate = validateOrThrow(DateFromString)
  const parseNumber = validateOrThrow(NumberFromString)
  rows.forEach(row => {
    const [date, state, fips, cases, deaths] = row
    const name = `US-${state}`
    const dateEntry = {
      date: parseDate(date),
      confirmed: parseNumber(cases),
      deaths: parseNumber(deaths),
      recovered: null
    }
    const stateEntry = result[name] || []
    result[name] = array.snoc(stateEntry, dateEntry)
  })
  return result
}

export const getCounties = (): Promise<any> => {
  return fetchPony("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv")
    .then(response => response.text())
    .then(parseCounties)
}

const parseCounties = (csv: string): CoronaData => {
  const parsed = Papa.parse(csv).data
  const rows = array.dropLeft(1)(parsed)
  const result = {}
  const parseDate = validateOrThrow(DateFromString)
  const parseNumber = validateOrThrow(NumberFromString)
  rows.forEach(row => {
    const [date, county, state, fips, cases, deaths] = row
    const name = `US-${state}-${county}`
    const dateEntry = {
      date: parseDate(date),
      confirmed: parseNumber(cases),
      deaths: parseNumber(deaths),
      recovered: null
    }
    const stateEntry = result[name] || []
    result[name] = array.snoc(stateEntry, dateEntry)
  })
  return result
}
