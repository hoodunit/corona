import * as React from "react"
import { Toggle } from "./Toggle"

export type XAxisTypeToggleProps = {
  onToggle: (xAxisType: XAxisType) => void
  selected: XAxisType
}

export type XAxisType = "relative" | "time-based"

export const XAxisTypeToggle: React.FC<XAxisTypeToggleProps> = (props) => {
  return <Toggle<"relative", "time-based">
    onToggle={props.onToggle}
    selected={props.selected}
    left="relative"
    right="time-based"
    title={title}
  />
}

const title = (xAxisType: XAxisType): string => {
  switch(xAxisType) {
    case "relative": return "Relative"
    case "time-based": return "Time-based"
  }
}
