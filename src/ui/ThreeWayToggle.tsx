import { ReactElement } from "react"
import * as React from "react"

export type ThreeWayToggleProps<Left, Middle, Right> = {
  onToggle: (val: Left | Middle | Right) => void
  selected: Left | Middle | Right
  left: Left
  middle: Middle
  right: Right
  title: (val: Left | Middle | Right) => string
}

export function ThreeWayToggle<Left, Middle, Right>(props: ThreeWayToggleProps<Left, Middle, Right>): ReactElement | null {
  return <div className="toggle">
    <div className={`toggle__left ${props.selected === props.left ? "toggle__left--selected" : ""}`}
         onClick={() => props.onToggle(props.left)}>
      {props.title(props.left)}
    </div>
    <div className={`toggle__middle ${props.selected === props.middle ? "toggle__middle--selected" : ""}`}
      onClick={() => props.onToggle(props.middle)}>
      {props.title(props.middle)}
    </div>
    <div className={`toggle__right ${props.selected === props.right ? "toggle__right--selected" : ""}`}
      onClick={() => props.onToggle(props.right)}>
      {props.title(props.right)}
    </div>
  </div>
}
