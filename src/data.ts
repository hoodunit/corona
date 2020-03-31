import { array, either } from "fp-ts"
import * as t from "io-ts"
import * as IoTsReporter from "io-ts-reporters"
import { DateFromString, NumberFromString } from "./codecs"
import Papa = require("papaparse")

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
  return {
    ...states,
    ...countries,
  }
}

const getCountries = (): Promise<CoronaData> => {
  return fetch("https://pomber.github.io/covid19/timeseries.json")
    .then(response => response.json())
    .then(data => {
      return validateOrThrow(CoronaDataSpec)(data)
    })
}

export const getStates = (): Promise<any> => {
  return fetch("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv")
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
