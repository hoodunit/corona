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
    onClick={() => props.onToggle(otherType)}>
    <div className={`toggle__left ${props.selected === "relative" ? "toggle__left--selected" : ""}`}>Relative</div>
    <div className={`toggle__right ${props.selected === "time-based" ? "toggle__right--selected" : ""}`}>Time-based</div>
  </div>
}
