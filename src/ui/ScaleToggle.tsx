import * as React from "react"
import { Toggle } from "./Toggle"

export type ScaleToggleProps = {
  onToggle: (scale: Scale) => void
  selected: Scale
}

export type Scale = "linear" | "log"

export const ScaleToggle: React.FC<ScaleToggleProps> = (props) => {
  return <Toggle<"log", "linear">
    onToggle={props.onToggle}
    selected={props.selected}
    left="log"
    right="linear"
    title={scaleTitle}
    />
}

const scaleTitle = (scale: Scale): string => {
  switch(scale) {
    case "linear": return "Linear"
    case "log": return "Logarithmic"
  }
}
