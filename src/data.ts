import { either } from "fp-ts"
import { Either } from "fp-ts/lib/Either"
import { Errors } from "io-ts"
import * as t from "io-ts"
import * as IoTsReporter from "io-ts-reporters"

// represents a Date from an ISO string
const DateFromString = new t.Type<Date, string, unknown>(
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

const DateEntrySpec = t.exact(t.type({
  date: DateFromString,
  confirmed: t.union([t.number, t.null]),
  deaths: t.union([t.number, t.null]),
  recovered: t.union([t.number, t.null])
}))
export type DateEntry = t.TypeOf<typeof DateEntrySpec>

const CoronaDataSpec = t.exact(t.type({
  Finland: t.array(DateEntrySpec),
  Italy: t.array(DateEntrySpec),
  US: t.array(DateEntrySpec),
}))
export type CoronaData = t.TypeOf<typeof CoronaDataSpec>

const validateOrThrow = <I,A>(decoder: t.Decoder<I,A>, val: I): A => {
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

export const getData = (): Promise<CoronaData> => {
  return fetch("https://pomber.github.io/covid19/timeseries.json")
    .then(response => response.json())
    .then(data => {
      return validateOrThrow(CoronaDataSpec, data)
    })
}
