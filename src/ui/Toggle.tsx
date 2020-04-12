import { ReactElement } from "react"
import * as React from "react"

export type ToggleProps<Left, Right> = {
  onToggle: (val: Left | Right) => void
  selected: Left | Right
  left: Left
  right: Right
  title: (val: Left | Right) => string
}

export function Toggle<Left, Right>(props: ToggleProps<Left, Right>): ReactElement | null {
  const otherVal: Left | Right = props.selected  === props.left ? props.right : props.left
  return <div
    className="toggle"
    onClick={() => props.onToggle(otherVal)}>
    <div className={`toggle__left ${props.selected === props.left ? "toggle__left--selected" : ""}`}>
      {props.title(props.left)}
    </div>
    <div className={`toggle__right ${props.selected === props.right ? "toggle__right--selected" : ""}`}>
      {props.title(props.right)}
    </div>
  </div>
}
