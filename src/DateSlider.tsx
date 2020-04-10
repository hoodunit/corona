import { array, option, record } from "fp-ts"
import { pipe } from "fp-ts/es6/pipeable"
import { getFirstSemigroup } from "fp-ts/lib/Semigroup"
import { default as Slider } from "rc-slider"
import * as React from "react"
import { DateRange } from "./dataHelpers"
import * as DateFns from "date-fns/fp"

export type DateSliderProps = {
  onSelect: (d: Date) => void
  range: DateRange
  selected: Date
}

export const DateSlider: React.FC<DateSliderProps> = (props) => {
  const marks = mkMarks(props.range)
  const selectedIndex = pipe(
    marks,
    record.toArray,
    array.findFirstMap(([index, date]) => {
      if (DateFns.isEqual(date, props.selected)) {
        return option.some(index)
      } else {
        return option.none
      }
    }),
    option.getOrElse(() => 0 as any as string)
  )
  const max = Object.values(marks).length - 1
  return (
    <div className="slider-wrapper">
      <Slider
        min={0}
        max={max}
        step={1}
        marks={marks}
        value={selectedIndex}
        onChange={(index: number) => {
          props.onSelect(marks[index])
        }}
      />
    </div>
  )
}

function asRecord<K extends string|number, V>(arr: Array<[K, V]>): {[k in K]: V} {
  const result = {} as any
  for (let i = 0; i < arr.length; i++) {
    result[arr[i][0]] = arr[i][1]
  }
  return result as any
}

const mkMarks = (range: DateRange): {[k: string]: Date} => {
  const days: number = DateFns.differenceInDays(range.start, range.end)
  const dayDates = pipe(
    array.range(0, days),
    array.map((day: number) => [day as any as string, DateFns.addDays(day, range.start)] as [string, Date])
  )
  // const asRecord: (arr: Array<[string, Date]>) => {[k: string]: Date} =
  //   record.fromFoldable(getFirstSemigroup<Date>(), array.array)
  return asRecord(dayDates)
}
