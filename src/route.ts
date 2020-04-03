export type Route = {
  selected: Array<string>
}

const prefix = "#selected="

export const encodeRoute = (route: Route): string => {
  if (route.selected.length === 0) {
    return ""
  }
  const selected = route.selected.map(encodeURIComponent).join(",")
  return `${prefix}${selected}`
}

export const decodeRoute = (hash: string, defaultRoute: Route): Route => {
  const prefix = "#selected="
  if (!hash.startsWith(prefix)) {
    return defaultRoute
  }
  try {
    const parseable = hash.substr(prefix.length)
    const selectedStrs = parseable.split(",")
    const selected = selectedStrs.map(decodeURIComponent).filter(s => !!s)
    if (selected.length === 0) {
      return defaultRoute
    }
    return {selected}
  } catch (e) {
    console.error(e)
    return defaultRoute
  }
}
