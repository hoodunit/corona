import * as React from "react"

export type ScaleToggleProps = {
  onToggle: (scale: Scale) => void
  selected: Scale
}

export type Scale = "linear" | "log"

export const ScaleToggle: React.FC<ScaleToggleProps> = (props) => {
  const otherScale: Scale = props.selected === "linear" ? "log" : "linear"
  return <div
    className="scale-toggle"
    onClick={() => props.onToggle(otherScale)}>{scaleTitle(props.selected)} </div>
}

const scaleTitle = (scale: Scale): string => {
  switch(scale) {
    case "linear": return "Linear"
    case "log": return "Logarithmic"
  }
}
