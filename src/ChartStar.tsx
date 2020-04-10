import * as DateFns from "date-fns/fp"
import * as React from "react"

export const ChartStar = (props: any) => {
  if (!props.value) {
    return null
  }
  const diameter = 3
  const date = props.date
  const dataDate = props.payload[props.placeKey]?.date
  if (date && DateFns.isEqual(date, dataDate)) {
    return (
      <svg width={diameter} height={diameter} style={{"overflow": "visible"}}>
        <text
          stroke="black"
          fill={props.stroke}
          x={props.cx - 7}
          y={props.cy + 6}>{"\u2605"}
        </text>
      </svg>
    )
  } else {
    const radius = 3
    const dotDiam = radius * 2
    return (<svg width={dotDiam} height={dotDiam} style={{"overflow": "visible"}}>
      <circle
        cx={props.cx}
        cy={props.cy}
        r={radius}
        stroke={props.stroke}
        strokeWidth="1"
        fill={props.stroke}
      />
    </svg>)
  }
}
