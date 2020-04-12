import { array, option } from "fp-ts"
import { pipe } from "fp-ts/lib/pipeable"
import { right } from "fp-ts/lib/Either"
import { TaskEither } from "fp-ts/lib/TaskEither"
import { JSZipObject } from "jszip"
import * as JSZip from "jszip"
import { DateFromString, NumberFromString } from "./codecs"
import { fetchPony } from "./fetch"
import { validateOrThrow } from "./validation"
import Papa = require("papaparse")

type IhmeProjection = {[k: string]: Array<IhmeDateEntry>}

type IhmeDateEntry = {
  date: Date
  deathsMean: number
  deathsUpper: number
  deathsLower: number
  totalDeathsMean: number
  totalDeathsUpper: number
  totalDeathsLower: number
}

export const getIhmeProjections: TaskEither<string, IhmeProjection> = () => {
  console.log("Loading IHME projections")
  return fetchPony("https://ihmecovid19storage.blob.core.windows.net/latest/ihme-covid19.zip")
    .then(response => response.arrayBuffer())
    .then(dataBuffer => {
      return JSZip.loadAsync(dataBuffer)
    })
    .then((zipData: JSZip) => {
      const csvZipFile: JSZipObject = pipe(
        zipData.files,
        Object.values,
        array.findFirst((f: JSZip.JSZipObject) => f.name.endsWith(".csv")),
        option.getOrElse<JSZipObject>(() => { throw new Error("No file?") })
      )
      return csvZipFile.async("string")
    })
    .then((csvStr: string) => {
      const parsed = Papa.parse(csvStr).data
      const rows = array.dropLeft(1)(parsed)
      const result = {}
      const parseDate = validateOrThrow(DateFromString)
      const parseNumber = validateOrThrow(NumberFromString)
      rows.forEach(row => {
        if (row && row.length > 10) {
          const [V1, location_name, date, allbed_mean, allbed_lower, allbed_upper, ICUbed_mean, ICUbed_lower,
            ICUbed_upper, InvVen_mean, InvVen_lower, InvVen_upper, deaths_mean, deaths_lower, deaths_upper,
            admis_mean, admis_lower, admis_upper, newICU_mean, newICU_lower, newICU_upper, totdea_mean,
            totdea_lower, totdea_upper, bedover_mean, bedover_lower, bedover_upper, icuover_mean, icuover_lower,
            icuover_upper]  = row
          console.log(row)
          const name = location_name
          const dateEntry = {
            date: parseDate(date),
            deathsMean: parseNumber(deaths_mean),
            deathsUpper: parseNumber(deaths_upper),
            deathsLower: parseNumber(deaths_lower),
            totalDeathsMean: parseNumber(totdea_mean),
            totalDeathsUpper: parseNumber(totdea_upper),
            totalDeathsLower: parseNumber(totdea_lower),
          }
          const placeEntry = result[name] || []
          result[name] = array.snoc(placeEntry, dateEntry)
        }
      })
      console.log(JSON.stringify(result, null, 2))
      return right(result)
    })
}

getIhmeProjections()

// "V1","location_name","date","allbed_mean","allbed_lower","allbed_upper","ICUbed_mean","ICUbed_lower","ICUbed_upper","InvVen_mean","InvVen_lower","InvVen_upper","deaths_mean","deaths_lower","deaths_upper","admis_mean","admis_lower","admis_upper","newICU_mean","newICU_lower","newICU_upper","totdea_mean","totdea_lower","totdea_upper","bedover_mean","bedover_lower","bedover_upper","icuover_mean","icuover_lower","icuover_upper"
