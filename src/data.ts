import { array, either, option, ord, record } from "fp-ts"
import { pipe } from "fp-ts/es6/pipeable"
import { sequenceT } from "fp-ts/lib/Apply"
import { ordNumber } from "fp-ts/lib/Ord"
import { TaskEither } from "fp-ts/lib/TaskEither"
import * as t from "io-ts"
import { DateFromString, NumberFromString } from "./codecs"
import Papa = require("papaparse")
import * as fetchPonyfill from "fetch-ponyfill"
import * as DateFns from "date-fns/fp"
import { Either } from "fp-ts/lib/Either"
import { validate, validateOrThrow } from "./validation"

export type CoronaData = {
  [k: string]: Array<DateEntry>
}

export type DateEntry = {
  date: Date
  confirmed: number | null
  deaths: number | null
  recovered: number | null
  newDeaths: number | null
  newCases: number | null
}

const fetchPony = fetchPonyfill({}).fetch

const RawDateEntrySpec = t.exact(t.type({
  date: DateFromString,
  confirmed: t.union([t.number, t.null]),
  deaths: t.union([t.number, t.null]),
  recovered: t.union([t.number, t.null]),
}))
type RawDateEntry = t.TypeOf<typeof RawDateEntrySpec>

const RawCoronaDataSpec = t.record(t.string, t.array(RawDateEntrySpec))
export type RawCoronaData = t.TypeOf<typeof RawCoronaDataSpec>

export const getData = async (): Promise<Either<string, CoronaData>> => {
  const results = await Promise.all([getCountries(), getStates(), getCounties()])
  const [countriesResult, statesResult, countiesResult]:
    [Either<string, CoronaData>, Either<string, CoronaData>, Either<string, CoronaData>] = results
  const result = sequenceT(either.either)(countriesResult, statesResult, countiesResult)
  return either.chain(([countries, states, counties]: [RawCoronaData, RawCoronaData, RawCoronaData]) => {
    const fullData: RawCoronaData = {
      ...states,
      ...countries,
      ...counties
    }
    const sorted = record.map(sortByDate)(fullData)
    const filled = record.map(fillEmptyEntries)(sorted)
    const withNewDeaths = record.map(addNewDeaths)(filled)
    return either.mapLeft(e => `${e}`)(validateEntries(withNewDeaths))
  })(result)
}

const addNewDeaths = (entries: Array<RawDateEntry>): Array<DateEntry> => {
  return array.reduce([], (cur: Array<DateEntry>, next: RawDateEntry) => {
    const newDeaths = pipe(
      array.last(cur),
      option.map((p: RawDateEntry) => {
        const prevDeaths = p.deaths || 0
        const nextDeaths = next.deaths || 0
        const newD = nextDeaths - prevDeaths
        // Correcting for a possible data issue
        // This should be handled more properly
        return (newD > 0 ? newD : 0)
        }),
      option.getOrElse(() => 0)
    )
    const newCases = pipe(
      array.last(cur),
      option.map((p: RawDateEntry) => {
        const prevCases = p.confirmed || 0
        const nextCases = next.confirmed || 0
        const newC = nextCases - prevCases
        // Correcting for a possible data issue
        // This should be handled more properly
        return (newC > 0 ? newC : 0)
      }),
      option.getOrElse(() => 0)
    )
    const updatedNext = {
      ...next,
      newDeaths,
      newCases
    }
    return array.snoc(cur, updatedNext) as Array<DateEntry>
  })(entries)
}

const sortByDate = (entries: Array<RawDateEntry>): Array<RawDateEntry> => {
  const byDate = pipe(
    ordNumber,
    ord.contramap((d: RawDateEntry) => {
      if (!d.date) {
        console.log(entries)
        throw new Error(`Error: ${JSON.stringify(d)}`)
      }
      return d.date.getTime()
    })
  )
  return array.sort(byDate)(entries)
}

const fillEmptyEntries = (entries: Array<RawDateEntry>): Array<RawDateEntry> => {
  const fillEntries = array.reduce([], (cur: Array<RawDateEntry>, next: RawDateEntry) => {
    const prev = cur[cur.length - 1]
    if (!prev) {
      return array.snoc(cur, next)
    }
    const dayDiff = DateFns.differenceInDays(prev.date, next.date)
    if (dayDiff <= 1) {
      return array.snoc(cur, next)
    }
    const missing: Array<RawDateEntry> = pipe(
      array.range(1, dayDiff - 1),
      array.map(days => {
        return {
          date: DateFns.addDays(days)(prev.date),
          confirmed: prev.confirmed,
          deaths: prev.deaths,
          recovered: prev.recovered,
          newDeaths: 0
        }
      })
    )
    return cur.concat(missing)
  })
  return fillEntries(entries)
}

const validateEntries = (data: CoronaData): Either<Error, CoronaData> => {
  return either.tryCatch(() => {
    record.mapWithIndex(validateEntry)(data)
    return data
  }, either.toError)

}

const validateEntry = (key: string, vals: Array<DateEntry>): void => {
  let prev: DateEntry | undefined = undefined
  for (let i = 0; i < vals.length; i++){
    const next = vals[i]
    if (prev && DateFns.isAfter(next.date, prev.date)) {
      throw new Error(`At ${key}[${i}]: expected ${prev.date} to be before ${next.date}`)
    }
    if (prev && DateFns.differenceInDays(prev.date, next.date) > 1) {
      throw new Error(`At ${key}[${i}]: expected ${prev.date} to be within one day of ${next.date}`)
    }
    // if (prev && prev.confirmed && next.confirmed && prev.confirmed > next.confirmed) {
    //   throw new Error(`At ${key}[${i}]: expected previous confirmed ${prev.confirmed} to be less than or equal to next confirmed ${next.confirmed}`)
    // }
    // if (prev && prev.deaths && next.deaths && prev.deaths > next.deaths) {
    //   throw new Error(`At ${key}[${i}]: expected previous deaths ${prev.deaths} to be less than or equal to next deaths ${next.deaths}`)
    // }
    prev = next
  }
}

const getCountries: TaskEither<string, RawCoronaData> = () => {
  return fetchPony("https://pomber.github.io/covid19/timeseries.json")
    .then(response => response.json())
    .then(data => {
      return validate(RawCoronaDataSpec)(data)
   })
}

export const getStates: TaskEither<string, RawCoronaData> = () => {
  return fetchPony("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv")
    .then(response => response.text())
    .then(r => either.tryCatch(() => parseStates(r), e => `${e}`))
}

const parseStates = (csv: string): RawCoronaData => {
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
    .then(r => either.tryCatch(() => parseCounties(r), e => `${e}`))
}

const parseCounties = (csv: string): RawCoronaData => {
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
