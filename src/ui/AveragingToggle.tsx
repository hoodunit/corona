import * as React from "react"
import { ThreeWayToggle } from "./ThreeWayToggle"

export type AveragingToggleProps = {
  onToggle: (val: Averaging) => void
  selected: Averaging
}

export type Averaging = "none" | "three-day" | "seven-day"

export const AveragingToggle: React.FC<AveragingToggleProps> = (props) => {
  return <ThreeWayToggle<"none", "three-day", "seven-day">
    onToggle={props.onToggle}
    selected={props.selected}
    left="none"
    middle="three-day"
    right="seven-day"
    title={title}
  />
}

const title = (val: Averaging): string => {
  switch(val) {
    case "none": return "No averaging"
    case "three-day": return "Three-day"
    case "seven-day": return "Seven-day"
  }
}
