import * as React from "react"

export type XAxisTypeToggleProps = {
  onToggle: (xAxisType: XAxisType) => void
  selected: XAxisType
}

export type XAxisType = "relative" | "time-based"

export const XAxisTypeToggle: React.FC<XAxisTypeToggleProps> = (props) => {
  const otherType: XAxisType = props.selected === "relative" ? "time-based" : "relative"
  return <div
    className="toggle"
    onClick={() => props.onToggle(otherType)}>{title(props.selected)} </div>
}

const title = (xAxisType: XAxisType): string => {
  switch(xAxisType) {
    case "relative": return "Relative"
    case "time-based": return "Time-based"
  }
}
