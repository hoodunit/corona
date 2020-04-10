import * as DateFns from "date-fns/fp"

export type Route = {
  lastDate: Date
  selected: Array<string>
}

const lastDateKey = "lastDate"
const selectedKey = "selected"

export const encodeRoute = (route: Route): string => {
  if (route.selected.length === 0) {
    return ""
  }
  const lastDateStr = DateFns.format("yyyy-MM-dd")(route.lastDate)
  const selectedStr = route.selected.map(encodeURIComponent).join(",")
  return `#${lastDateKey}=${lastDateStr}&${selectedKey}=${selectedStr}`
}

export const decodeRoute = (hash: string, defaultRoute: Route): Route => {
  try {
    const parseable = hash.substr(1)
    const [lastDateEntry, selectedEntry] = parseable.split("&")
    const lastDateStr = lastDateEntry.substr(lastDateKey.length + 1)
    const lastDate = DateFns.parse(new Date())("yyyy-MM-dd")(lastDateStr)
    const selectedStr = selectedEntry.substr(selectedKey.length + 1)
    const selectedStrs = selectedStr.split(",")
    const parsedSelected = selectedStrs.map(decodeURIComponent).filter(s => !!s)
    const selected = parsedSelected.length === 0 ? [] : parsedSelected
    return {lastDate, selected}
  } catch (e) {
    console.error(`Error parsing route from hash '${hash}'`, e)
    return defaultRoute
  }
}
