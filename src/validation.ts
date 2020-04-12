import { either } from "fp-ts"
import { pipe } from "fp-ts/lib/pipeable"
import { Either } from "fp-ts/lib/Either"
import * as t from "io-ts"
import * as IoTsReporter from "io-ts-reporters"

export const validateOrThrow = <I,A>(decoder: t.Decoder<I,A>) => (val: I): A => {
  const onError = (errors: t.Errors) => {
    throw new Error(formatErrors(errors))
  }
  const fold = either.fold(onError, decodedVal => decodedVal as any)
  const decoded = decoder.decode(val)
  return fold(decoded)
}

export const validate = <I,A>(decoder: t.Decoder<I,A>) => (val: I): Either<string, A> => {
  return pipe(
    val,
    decoder.decode,
    either.mapLeft(formatErrors)
  )
}

function formatErrors(errors: Array<t.ValidationError>): string {
  return IoTsReporter.reporter(either.left(errors)).join('\n')
}
