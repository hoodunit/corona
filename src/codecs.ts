import { either } from "fp-ts"
import { Either, right } from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/pipeable"
import { Errors } from "io-ts"
import * as DateFns from "date-fns/fp"
import * as t from "io-ts"

export const DateFromString = new t.Type<Date, string, unknown>(
  'DateFromString',
  (u): u is Date => u instanceof Date,
  (u, c) => {
    const validated: Either<Errors, string> = t.string.validate(u, c)
    return pipe(
      validated,
      either.chain((s) => {
        const parseDate = DateFns.parse(new Date())("yyyy-M-d")
        const parsed: Either<string, Date> = either.tryCatch(() => parseDate(s as any), e => `${e}`)
        return either.fold(err => t.failure(err, c), (d: Date) => right(d))(parsed)
      })
    )
  },
  date => {
    return DateFns.format("yyyy-M-d", date)
  }
)

export interface NumberFromStringC extends t.Type<number, string, unknown> {}

export const NumberFromString: NumberFromStringC = new t.Type<number, string, unknown>(
  'NumberFromString',
  t.number.is,
  (u, c) => {
    const validated = t.string.validate(u, c)
    return either.chain((s: any) => {
      const n: number = +s
      const result: Either<Errors, number> = isNaN(n) || s.trim() === '' ? t.failure(u, c) : t.success(n)
      return result
    })(validated)
  },
  String
)
