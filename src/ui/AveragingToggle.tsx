import * as React from "react"
import { Toggle } from "./Toggle"

export type AveragingToggleProps = {
  onToggle: (val: Averaging) => void
  selected: Averaging
}

export type Averaging = "none" | "three-day"

export const AveragingToggle: React.FC<AveragingToggleProps> = (props) => {
  return <Toggle<"none", "three-day">
    onToggle={props.onToggle}
    selected={props.selected}
    left="none"
    right="three-day"
    title={title}
  />
}

const title = (val: Averaging): string => {
  switch(val) {
    case "none": return "No averaging"
    case "three-day": return "Three-day average"
  }
}
