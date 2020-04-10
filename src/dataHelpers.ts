import { nonEmptyArray, option, ord, record } from "fp-ts"
import { flow } from "fp-ts/es6/function"
import { Option } from "fp-ts/es6/Option"
import { Ord, ordDate } from "fp-ts/es6/Ord"
import { pipe } from "fp-ts/es6/pipeable"
import { CoronaData, DateEntry } from "./data"

export type DateRange = {
  start: Date
  end: Date
}

export const ordDateEntry: Ord<DateEntry> = ord.contramap((d: DateEntry) => d.date)(ordDate)

export const dateArrayMin: (a: Array<DateEntry>) => Option<Date> = flow(
  nonEmptyArray.fromArray,
  option.map(flow(nonEmptyArray.min(ordDateEntry), d => d.date))
)

export const dateArrayMax: (a: Array<DateEntry>) => Option<Date> = flow(
  nonEmptyArray.fromArray,
  option.map(flow(nonEmptyArray.max(ordDateEntry), d => d.date))
)

export const dataDateRange = (data: CoronaData): Option<DateRange> => {
  const minDate: Option<Date> = record.reduce(option.none, (min: Option<Date>, next: Array<DateEntry>) => {
    return option.fold(() => dateArrayMin(next), (curMin: Date) => {
      return pipe(
        next,
        dateArrayMin,
        option.map(d => ord.min(ordDate)(d, curMin)))
    })(min)
  })(data)
  const maxDate: Option<Date> = record.reduce(option.none, (max: Option<Date>, next: Array<DateEntry>) => {
    return option.fold(() => dateArrayMax(next), (curMax: Date) => {
      return pipe(
        next,
        dateArrayMax,
        option.map(d => ord.max(ordDate)(d, curMax)))
    })(max)
  })(data)
  return pipe(
    minDate,
    option.chain((start: Date) => option.map((end: Date) => ({start, end}))(maxDate))
  )
}
