import * as React from "react"

export type ScaleToggleProps = {
  onToggle: (scale: Scale) => void
  selected: Scale
}

export type Scale = "linear" | "log"

export const ScaleToggle: React.FC<ScaleToggleProps> = (props) => {
  const otherScale: Scale = props.selected === "linear" ? "log" : "linear"
  return <div
    className="toggle"
    onClick={() => props.onToggle(otherScale)}>
    <div className={`toggle__left ${props.selected === "log" ? "toggle__left--selected" : ""}`}>Logarithmic</div>
    <div className={`toggle__right ${props.selected === "linear" ? "toggle__right--selected" : ""}`}>Linear</div>
  </div>
}

const scaleTitle = (scale: Scale): string => {
  switch(scale) {
    case "linear": return "Linear"
    case "log": return "Logarithmic"
  }
}
