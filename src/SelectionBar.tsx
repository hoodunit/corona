import * as React from "react"
import { largeAndSmall, epicenters, smallPlaces, usStates, nordicsPlus, europeanUnion } from "./selections"

const options: Array<SelectionOption> = [
  {label: "Epicenters", selected: epicenters},
  {label: "U.S. states", selected: usStates},
  {label: "Nordics+", selected: nordicsPlus},
  {label: "European Union", selected: europeanUnion},
  {label: "Large and small", selected: largeAndSmall},
  {label: "Local areas", selected: smallPlaces},
]

type SelectionOption = {
  label: string
  selected: Array<string>
}

export type SelectionBarProps = {
  onSelected: (selected: Array<string>) => void
}

export const SelectionBar: React.FC<SelectionBarProps> = (props) => {
  return <div className="selection-bar">
    { options.map((opts) => {
      return <SelectOption
        {...opts}
        key={opts.label}
        onClick={props.onSelected}
      />
    })}
  </div>
}

export type SelectOptionProps = {
  label: string
  selected: Array<string>
  onClick: (selected: Array<string>) => void
}

export const SelectOption: React.FC<SelectOptionProps> = (props) => {
  const onClick = () => {
    props.onClick(props.selected)
  }
  return <div className="button" onClick={onClick}>{props.label}</div>
}
