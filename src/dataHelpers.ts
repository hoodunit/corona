import { array, nonEmptyArray, option, ord, record } from "fp-ts"
import { flow } from "fp-ts/lib/function"
import { Option } from "fp-ts/lib/Option"
import { Ord, ordDate, ordNumber } from "fp-ts/lib/Ord"
import { pipe } from "fp-ts/lib/pipeable"
import { CoronaData, DateEntry } from "./data"

export type DateRange = {
  start: Date
  end: Date
}

export const ordDateEntry: Ord<DateEntry> = ord.contramap((d: DateEntry) => d.date)(ordDate)

export const dateArrayMinByDate: (a: Array<DateEntry>) => Option<Date> = flow(
  nonEmptyArray.fromArray,
  option.map(flow(nonEmptyArray.min(ordDateEntry), d => d.date))
)

export const dateArrayMaxByDate: (a: Array<DateEntry>) => Option<Date> = flow(
  nonEmptyArray.fromArray,
  option.map(flow(nonEmptyArray.max(ordDateEntry), d => d.date))
)

export const dateArrayMaxDeaths: (a: Array<DateEntry>) => Option<number> = flow(
  array.last,
  option.chain(d => option.fromNullable(d.deaths))
)

export const dataDateRange = (data: CoronaData): Option<DateRange> => {
  const minDate: Option<Date> = record.reduce(option.none, (min: Option<Date>, next: Array<DateEntry>) => {
    return option.fold(() => dateArrayMinByDate(next), (curMin: Date) => {
      return pipe(
        next,
        dateArrayMinByDate,
        option.map(d => ord.min(ordDate)(d, curMin)))
    })(min)
  })(data)
  const maxDate: Option<Date> = record.reduce(option.none, (max: Option<Date>, next: Array<DateEntry>) => {
    return option.fold(() => dateArrayMaxByDate(next), (curMax: Date) => {
      return pipe(
        next,
        dateArrayMaxByDate,
        option.map(d => ord.max(ordDate)(d, curMax)))
    })(max)
  })(data)
  return pipe(
    minDate,
    option.chain((start: Date) => option.map((end: Date) => ({start, end}))(maxDate))
  )
}

const byMaxDeathsAsc: Ord<[string, Array<DateEntry>]> = ord.contramap(([_, arr]: [string, Array<DateEntry>]) => {
  return pipe(
    arr,
    array.last,
    option.chain((d: DateEntry) => option.fromNullable(d.deaths)),
    option.getOrElse(() => 0)
  )
})(ordNumber)

const byMaxDeathsDesc: Ord<[string, Array<DateEntry>]> = ord.getDualOrd(byMaxDeathsAsc)

export const sortByDeaths = (data: CoronaData): Array<[string, Array<DateEntry>]> => {
  const entries = record.toArray(data)
  return array.sort(byMaxDeathsDesc)(entries)
}

export const topByDeaths = (data: CoronaData, num: number): Array<string> => {
  return pipe(
    data,
    sortByDeaths,
    array.takeLeft(num),
    array.map(([key, _]) => key)
  )
}
