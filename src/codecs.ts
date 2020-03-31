import { either } from "fp-ts"
import { Either } from "fp-ts/lib/Either"
import { Errors } from "io-ts"

// represents a Date from an ISO string
import * as t from "io-ts"

export const DateFromString = new t.Type<Date, string, unknown>(
  'DateFromString',
  (u): u is Date => u instanceof Date,
  (u, c) => {
    const validated = t.string.validate(u, c)
    return either.chain((s) => {
      const d = new Date(s as any)
      const result: Either<Errors, Date> = isNaN(d.getTime()) ? t.failure(u, c) : t.success(d)
      return result
    })(validated)
  },
  a => a.toISOString()
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
